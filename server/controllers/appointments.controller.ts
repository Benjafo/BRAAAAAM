import { and, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Request, Response } from "express";
import {
    appointments,
    clients,
    customFormResponses,
    customForms,
    locations,
    roles,
    users,
    userUnavailability,
} from "../drizzle/org/schema.js";
import { findOrCreateLocation } from "../utils/locations.js";
import { hasPermission } from "../utils/permissions.js";
import { applyQueryFilters } from "../utils/queryParams.js";

/*
 * Example Output
    {
    "startDate": "string",
    "startTime": "string",
    "estimatedEndDate": "string",
    "estimatedEndTime": "string",
    "Client": [
        "string"
    ],
    "pickupLocation": "string",
    "dropoffLocation": "string",
    "status": "string"
    }
 */

export const listAppointments = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Use based on org DB
        const db = req.org?.db;
        if (!db) return res.status(400).json({ message: "Organization context missing" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Check if user has ALL or OWN permissions
        const hasAllPermission = await hasPermission(userId, "allappointments.read", db);

        // Create aliases for pickup and destination locations to join both
        const pickupLocations = alias(locations, "pickup_locations");
        const destinationLocations = alias(locations, "destination_locations");
        const driverUsers = alias(users, "driver_users");

        // Define columns for searching, sorting, and filtering
        const statusText = sql<string>`${appointments.status}::text`;
        const searchableColumns = [
            clients.firstName,
            clients.lastName,
            driverUsers.firstName,
            driverUsers.lastName,
            destinationLocations.addressLine1,
            destinationLocations.city,
            pickupLocations.addressLine1,
            pickupLocations.city,
            appointments.tripPurpose,
            statusText,
        ];

        const sortableColumns: Record<string, any> = {
            date: appointments.startDate,
            time: appointments.startTime,
            client: clients.firstName,
            destination: destinationLocations.addressLine1,
            driver: driverUsers.firstName,
            status: appointments.status,
        };

        const filterableColumns: Record<string, any> = {
            date: appointments.startDate,
            time: appointments.startTime,
            client: [clients.firstName, clients.lastName],
            destination: destinationLocations.addressLine1,
            driver: [driverUsers.firstName, driverUsers.lastName],
            status: statusText,
        };

        const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(
            req,
            searchableColumns,
            sortableColumns,
            filterableColumns
        );

        // Apply own/all permission filtering
        const filters: any[] = [where];

        // If user only has OWN permission, restrict to unassigned OR assigned to them
        if (!hasAllPermission) {
            // Filter: driverId IS NULL OR driverId = userId
            filters.push(
                sql`${appointments.driverId} IS NULL OR ${appointments.driverId} = ${userId}`
            );
        }

        const filteredWhere = filters.length > 1 ? and(...filters) : filters[0];

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(appointments)
            .leftJoin(clients, eq(appointments.clientId, clients.id))
            .leftJoin(users, eq(appointments.dispatcherId, users.id))
            .leftJoin(driverUsers, eq(appointments.driverId, driverUsers.id))
            .leftJoin(pickupLocations, eq(appointments.pickupLocation, pickupLocations.id))
            .leftJoin(
                destinationLocations,
                eq(appointments.destinationLocation, destinationLocations.id)
            )
            .where(filteredWhere);

        const allAppointments = await db
            .select({
                id: appointments.id,
                // Appointment info
                date: appointments.startDate,
                time: appointments.startTime,
                status: appointments.status,
                tripPurpose: appointments.tripPurpose,
                tripType: appointments.tripType,
                // Client
                clientId: appointments.clientId,
                clientFirstName: clients.firstName,
                clientLastName: clients.lastName,
                // Driver
                driverId: appointments.driverId,
                driverFirstName: driverUsers.firstName,
                driverLastName: driverUsers.lastName,
                // Dispatcher
                dispatcherId: appointments.dispatcherId,
                dispatcherFirstName: users.firstName,
                dispatcherLastName: users.lastName,
                // Pickup location
                pickupLocationId: appointments.pickupLocation,
                pickupAddressLine1: pickupLocations.addressLine1,
                pickupAddressLine2: pickupLocations.addressLine2,
                pickupCity: pickupLocations.city,
                pickupState: pickupLocations.state,
                pickupZip: pickupLocations.zip,
                // Destination location
                destinationLocationId: appointments.destinationLocation,
                destinationAddressLine1: destinationLocations.addressLine1,
                destinationAddressLine2: destinationLocations.addressLine2,
                destinationCity: destinationLocations.city,
                destinationState: destinationLocations.state,
                destinationZip: destinationLocations.zip,
            })
            .from(appointments)
            .leftJoin(clients, eq(appointments.clientId, clients.id))
            .leftJoin(users, eq(appointments.dispatcherId, users.id))
            .leftJoin(driverUsers, eq(appointments.driverId, driverUsers.id))
            .leftJoin(pickupLocations, eq(appointments.pickupLocation, pickupLocations.id))
            .leftJoin(
                destinationLocations,
                eq(appointments.destinationLocation, destinationLocations.id)
            )
            .where(filteredWhere)
            .orderBy(...(orderBy.length > 0 ? orderBy : []))
            .limit(limit)
            .offset(offset);

        // Fetch custom field responses for all appointments
        const appointmentIds = allAppointments.map((appointment) => appointment.id);
        const customFieldResponses =
            appointmentIds.length > 0
                ? await db
                      .select()
                      .from(customFormResponses)
                      .where(
                          and(
                              eq(customFormResponses.entityType, "appointment"),
                              inArray(customFormResponses.entityId, appointmentIds)
                          )
                      )
                : [];

        // Create a map of appointmentId -> customFields
        const customFieldsMap = new Map();
        for (const response of customFieldResponses) {
            customFieldsMap.set(response.entityId, response.responseData);
        }

        // Add customFields to each appointment
        const resultsWithCustomFields = allAppointments.map((appointment) => ({
            ...appointment,
            customFields: customFieldsMap.get(appointment.id) || {},
        }));

        return res.status(200).json({
            page,
            pageSize,
            total: Number(total),
            results: resultsWithCustomFields,
        });
    } catch (err) {
        console.error("Error listing appointments:", err);
        return res.status(500).send();
    }
};

export const createAppointment = async (req: Request, res: Response): Promise<Response> => {
    const data = req.body;
    if (
        !data.startDate ||
        !data.startTime ||
        !data.clientId ||
        !data.dispatcherId ||
        !data.pickupAddress ||
        !data.destinationAddress
    ) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const db = req.org?.db;
        if (!db) return res.status(400).json({ message: "Organization context missing" });

        const pickupLocationId = await findOrCreateLocation(db, data.pickupAddress);
        const destinationLocationId = await findOrCreateLocation(db, data.destinationAddress);

        const [newAppointment] = await db
            .insert(appointments)
            .values({
                clientId: data.clientId,
                driverId: data.driverId || null,
                dispatcherId: data.dispatcherId,
                createdByUserId: data.createdByUserId,
                status: data.status || "Unassigned",
                startDate: data.startDate,
                startTime: data.startTime,
                estimatedDurationMinutes: data.estimatedDurationMinutes || null,
                pickupLocation: pickupLocationId,
                destinationLocation: destinationLocationId,
                tripType: data.tripType || "roundTrip",
                tripPurpose: data.tripPurpose || null,
                notes: data.notes || null,
                donationType: data.donationType || "None",
                donationAmount: data.donationAmount || null,
                milesDriven: data.milesDriven || null,
            })
            .returning();

        // Save custom field responses if provided
        if (data.customFields && Object.keys(data.customFields).length > 0) {
            const [appointmentForm] = await db
                .select()
                .from(customForms)
                .where(
                    and(eq(customForms.targetEntity, "appointment"), eq(customForms.isActive, true))
                );

            if (appointmentForm) {
                await db.insert(customFormResponses).values({
                    formId: appointmentForm.id,
                    entityId: newAppointment.id,
                    entityType: "appointment",
                    responseData: data.customFields,
                    submittedBy: req.user?.id || data.createdByUserId,
                });
            }
        }

        return res.status(201).json(newAppointment);
    } catch (err) {
        console.error("Error creating appointment:", err);
        return res.status(500).send();
    }
};

export const getAppointment = async (req: Request, res: Response): Promise<Response> => {
    const { appointmentId } = req.params;

    try {
        const db = req.org?.db;
        if (!db) return res.status(400).json({ message: "Organization context missing" });

        const [appointment] = await db
            .select()
            .from(appointments)
            .where(eq(appointments.id, appointmentId));

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Check permissions
        const hasAllPermission = await hasPermission(userId, "allappointments.read", db);

        // If user only has OWN permission, verify they can access this appointment
        if (!hasAllPermission) {
            // User can only see unassigned appointments or their own
            if (appointment.driverId !== null && appointment.driverId !== userId) {
                return res
                    .status(403)
                    .json({
                        message:
                            "You can only view unassigned appointments or appointments assigned to you",
                    });
            }
        }

        // Fetch custom field responses
        const [response] = await db
            .select()
            .from(customFormResponses)
            .where(
                and(
                    eq(customFormResponses.entityId, appointmentId),
                    eq(customFormResponses.entityType, "appointment")
                )
            );

        const appointmentWithCustomFields = {
            ...appointment,
            customFields: response?.responseData || {},
        };

        return res.status(200).json(appointmentWithCustomFields);
    } catch (err) {
        console.error("Error fetching appointment:", err);
        return res.status(500).send();
    }
};

export const updateAppointment = async (req: Request, res: Response): Promise<Response> => {
    const { appointmentId } = req.params;
    const data = req.body;

    try {
        const db = req.org?.db;
        if (!db) return res.status(400).json({ message: "Organization context missing" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Check permissions
        const hasAllPermission = await hasPermission(userId, "allappointments.update", db);

        // If user only has OWN permission, verify they can update this appointment
        if (!hasAllPermission) {
            // Fetch the current appointment to check ownership
            const [currentAppointment] = await db
                .select({ driverId: appointments.driverId })
                .from(appointments)
                .where(eq(appointments.id, appointmentId));

            if (!currentAppointment) {
                return res.status(404).json({ message: "Appointment not found" });
            }

            if (currentAppointment.driverId !== null && currentAppointment.driverId !== userId) {
                return res
                    .status(403)
                    .json({ message: "You can only update appointments assigned to you" });
            }
        }

        const updateData: Record<string, unknown> = {};
        if (data.pickupAddress) {
            updateData.pickupLocation = await findOrCreateLocation(db, data.pickupAddress);
        }
        if (data.destinationAddress) {
            updateData.destinationLocation = await findOrCreateLocation(
                db,
                data.destinationAddress
            );
        }
        if (data.startDate) updateData.startDate = data.startDate;
        if (data.startTime) updateData.startTime = data.startTime;
        if (data.clientId) updateData.clientId = data.clientId;
        if (data.driverId !== undefined) updateData.driverId = data.driverId;
        if (data.dispatcherId) updateData.dispatcherId = data.dispatcherId;
        if (data.status) updateData.status = data.status;
        if (data.tripPurpose !== undefined) updateData.tripPurpose = data.tripPurpose;
        if (data.estimatedDurationMinutes)
            updateData.estimatedDurationMinutes = data.estimatedDurationMinutes;
        if (data.tripType) updateData.tripType = data.tripType;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.donationType) updateData.donationType = data.donationType;
        if (data.donationAmount !== undefined) updateData.donationAmount = data.donationAmount;
        if (data.milesDriven !== undefined) updateData.milesDriven = data.milesDriven;

        const [updated] = await db
            .update(appointments)
            .set(updateData)
            .where(eq(appointments.id, appointmentId))
            .returning();

        // No appointment with fetched ID
        if (!updated) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Update custom field responses if provided
        if (data.customFields) {
            const [appointmentForm] = await db
                .select()
                .from(customForms)
                .where(
                    and(eq(customForms.targetEntity, "appointment"), eq(customForms.isActive, true))
                );

            if (appointmentForm) {
                // Check if response already exists
                const [existingResponse] = await db
                    .select()
                    .from(customFormResponses)
                    .where(
                        and(
                            eq(customFormResponses.formId, appointmentForm.id),
                            eq(customFormResponses.entityId, appointmentId),
                            eq(customFormResponses.entityType, "appointment")
                        )
                    );

                if (existingResponse) {
                    // Update existing response
                    await db
                        .update(customFormResponses)
                        .set({
                            responseData: data.customFields,
                            submittedBy: req.user?.id,
                            updatedAt: new Date().toISOString(),
                        })
                        .where(eq(customFormResponses.id, existingResponse.id));
                } else {
                    // Create new response
                    await db.insert(customFormResponses).values({
                        formId: appointmentForm.id,
                        entityId: appointmentId,
                        entityType: "appointment",
                        responseData: data.customFields,
                        submittedBy: req.user?.id,
                    });
                }
            }
        }

        return res.status(200).json(updated);
    } catch (err) {
        console.error("Error updating appointment:", err);
        return res.status(500).send();
    }
};

export const getMatchingDrivers = async (req: Request, res: Response): Promise<Response> => {
    const { appointmentId } = req.params;

    try {
        const db = req.org?.db;
        if (!db) return res.status(400).json({ message: "Organization context missing" });

        // Verify appointment exists and get client details
        const [appointment] = await db
            .select()
            .from(appointments)
            .where(eq(appointments.id, appointmentId));

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Get client details for matching
        const [client] = await db
            .select()
            .from(clients)
            .where(eq(clients.id, appointment.clientId));

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        // Get all active drivers with their accommodation capabilities
        const allDrivers = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                phone: users.phone,
                contactPreference: users.contactPreference,
                isActive: users.isActive,
                roleId: users.roleId,
                roleName: roles.name,
                canAccommodateMobilityEquipment: users.canAccommodateMobilityEquipment,
                vehicleType: users.vehicleType,
                canAccommodateOxygen: users.canAccommodateOxygen,
                canAccommodateServiceAnimal: users.canAccommodateServiceAnimal,
                canAccommodateAdditionalRider: users.canAccommodateAdditionalRider,
                address: {
                    id: locations.id,
                    addressLine1: locations.addressLine1,
                    addressLine2: locations.addressLine2,
                    city: locations.city,
                    state: locations.state,
                    zip: locations.zip,
                    country: locations.country,
                },
            })
            .from(users)
            .leftJoin(locations, eq(users.addressLocation, locations.id))
            .leftJoin(roles, eq(users.roleId, roles.id))
            .where(sql`${users.isDriver} = true AND ${users.isActive} = true`);

        // Get unavailability blocks for all drivers
        const driverIds = allDrivers.map((d) => d.id);
        const unavailabilityBlocks =
            driverIds.length > 0
                ? await db
                      .select()
                      .from(userUnavailability)
                      .where(inArray(userUnavailability.userId, driverIds))
                : [];

        // Helper function to check if driver has unavailability during appointment time
        const hasUnavailability = (driverId: string): boolean => {
            const driverBlocks = unavailabilityBlocks.filter((block) => block.userId === driverId);

            for (const block of driverBlocks) {
                if (block.isRecurring) {
                    // For recurring blocks, check if appointment day matches recurring day
                    const appointmentDayOfWeek = new Date(appointment.startDate).toLocaleDateString(
                        "en-US",
                        { weekday: "long" }
                    );
                    if (block.recurringDayOfWeek === appointmentDayOfWeek) {
                        // Check time overlap if not all-day
                        if (block.isAllDay) return true;
                        if (block.startTime && block.endTime && appointment.startTime) {
                            if (
                                appointment.startTime >= block.startTime &&
                                appointment.startTime < block.endTime
                            ) {
                                return true;
                            }
                        }
                    }
                } else {
                    // For non-recurring blocks, check date and time overlap
                    if (
                        appointment.startDate >= block.startDate &&
                        appointment.startDate <= block.endDate
                    ) {
                        if (block.isAllDay) return true;
                        if (block.startTime && block.endTime && appointment.startTime) {
                            if (
                                appointment.startTime >= block.startTime &&
                                appointment.startTime < block.endTime
                            ) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        };

        // Calculate score for each driver
        const driversWithScores = allDrivers.map((driver) => {
            let score = 0;

            // 1. Availability Check (1 point)
            if (!hasUnavailability(driver.id)) {
                score += 1;
            }

            // 2. Mobility Equipment Match (1 point)
            const clientMobilityEquipment = client.mobilityEquipment || [];
            const driverCanAccommodate = driver.canAccommodateMobilityEquipment || [];
            const canAccommodateAllEquipment = clientMobilityEquipment.every(
                (equipment: "cane" | "crutches" | "lightweight_walker" | "rollator" | "other") =>
                    driverCanAccommodate.includes(equipment)
            );
            if (clientMobilityEquipment.length === 0 || canAccommodateAllEquipment) {
                score += 1;
            }

            // 3. Vehicle Type Match (1 point)
            const clientVehicleTypes = client.vehicleTypes || [];
            if (
                clientVehicleTypes.length === 0 ||
                (driver.vehicleType && clientVehicleTypes.includes(driver.vehicleType))
            ) {
                score += 1;
            }

            // 4. Oxygen Match (1 point)
            if (!client.hasOxygen || driver.canAccommodateOxygen) {
                score += 1;
            }

            // 5. Service Animal Match (1 point)
            if (!client.hasServiceAnimal || driver.canAccommodateServiceAnimal) {
                score += 1;
            }

            // 6. Additional Rider Match (1 point)
            // Note: Additional rider info may come from appointment in the future
            // For now, if driver can accommodate, they get the point
            if (driver.canAccommodateAdditionalRider) {
                score += 1;
            }

            return {
                ...driver,
                matchScore: score,
            };
        });

        // Sort by score (descending) and take top 10
        const topDrivers = driversWithScores
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 10);

        return res.status(200).json({ results: topDrivers });
    } catch (err) {
        console.error("Error fetching matching drivers:", err);
        return res.status(500).send();
    }
};

export const acceptAppointment = async (req: Request, res: Response): Promise<Response> => {
    const { appointmentId } = req.params;

    try {
        const db = req.org?.db;
        if (!db) return res.status(400).json({ message: "Organization context missing" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Fetch the appointment
        const [appointment] = await db
            .select()
            .from(appointments)
            .where(eq(appointments.id, appointmentId));

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Verify the appointment is unassigned
        if (appointment.driverId !== null) {
            return res.status(400).json({ message: "This ride has already been assigned to a driver" });
        }

        // Update appointment with driver and status
        const [updated] = await db
            .update(appointments)
            .set({
                driverId: userId,
                status: "Scheduled",
            })
            .where(eq(appointments.id, appointmentId))
            .returning();

        return res.status(200).json(updated);
    } catch (err) {
        console.error("Error accepting appointment:", err);
        return res.status(500).send();
    }
};
