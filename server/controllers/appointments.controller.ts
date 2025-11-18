import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Request, Response } from "express";
import { startOfWeek, endOfWeek } from "date-fns";
import {
    appointments,
    clients,
    customFormResponses,
    customForms,
    locations,
    messageRecipients,
    messages,
    roles,
    users,
    userUnavailability,
} from "../drizzle/org/schema.js";
import { sendDriverNotificationEmail } from "../utils/email.js";
import { findOrCreateLocation } from "../utils/locations.js";
import { hasPermission } from "../utils/permissions.js";
import { applyQueryFilters } from "../utils/queryParams.js";
import { calculateDriverScore, generateMatchReasons, calculateScoreBreakdown, isPerfectMatch } from "../utils/matching/index.js";
import type { MatchingContext, ScoredDriver, UnavailabilityBlock } from "../types/matching.types.js";

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
                // Completion fields
                milesDriven: appointments.milesDriven,
                estimatedDurationMinutes: appointments.estimatedDurationMinutes,
                actualDurationMinutes: appointments.actualDurationMinutes,
                notes: appointments.notes,
                donationType: appointments.donationType,
                donationAmount: appointments.donationAmount,
                // Additional rider fields
                hasAdditionalRider: appointments.hasAdditionalRider,
                additionalRiderFirstName: appointments.additionalRiderFirstName,
                additionalRiderLastName: appointments.additionalRiderLastName,
                relationshipToClient: appointments.relationshipToClient,
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
                actualDurationMinutes: data.actualDurationMinutes || null,
                pickupLocation: pickupLocationId,
                destinationLocation: destinationLocationId,
                tripType: data.tripType || "roundTrip",
                tripPurpose: data.tripPurpose || null,
                notes: data.notes || null,
                hasAdditionalRider: data.hasAdditionalRider || false,
                additionalRiderFirstName: data.additionalRiderFirstName || null,
                additionalRiderLastName: data.additionalRiderLastName || null,
                relationshipToClient: data.relationshipToClient || null,
                donationType: data.donationType || "None",
                donationAmount: data.donationAmount || null,
                milesDriven: data.milesDriven || null,
            })
            .returning();

        let customFormFieldsRecord;

        // Save custom field responses if provided
        if (data.customFields && Object.keys(data.customFields).length > 0) {
            const [appointmentForm] = await db
                .select()
                .from(customForms)
                .where(
                    and(eq(customForms.targetEntity, "appointment"), eq(customForms.isActive, true))
                );

            if (appointmentForm) {
                const [appointmentCustomFormFields] = await db.insert(customFormResponses).values({
                    formId: appointmentForm.id,
                    entityId: newAppointment.id,
                    entityType: "appointment",
                    responseData: data.customFields,
                    submittedBy: req.user?.id || data.createdByUserId,
                }).returning();

                customFormFieldsRecord = appointmentCustomFormFields;
            }
        }

        req.auditLog({
            actionType: "appointment.created",
            objectId: newAppointment.id,
            objectType: "appointment",
            actionMessage: `Appointment created with ID ${newAppointment.id}`,
            actionDetails: { 
                appointment: newAppointment,
                customFormFields: customFormFieldsRecord || null,
             },
        });

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
                return res.status(403).json({
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
        const hasOwnPermission = await hasPermission(userId, "ownappointments.update", db);

        if (!hasAllPermission && !hasOwnPermission) {
            return res.status(403).json({ message: "Insufficient permissions to update appointments" });
        }

        // Fetch the current appointment to check ownership if needed
        const [currentAppointment] = await db
            .select({ driverId: appointments.driverId })
            .from(appointments)
            .where(eq(appointments.id, appointmentId));

        if (!currentAppointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // If user only has OWN permission, verify they can update this appointment
        if (!hasAllPermission && hasOwnPermission) {
            if (currentAppointment.driverId !== userId) {
                return res
                    .status(403)
                    .json({ message: "You can only update appointments assigned to you" });
            }
        }

        // Build update data based on permissions
        const updateData: Record<string, unknown> = {};

        // Fields that drivers with ownappointments.update can modify (completion fields only)
        const driverAllowedFields = ["status", "milesDriven", "actualDurationMinutes", "estimatedDurationMinutes", "notes", "donationType", "donationAmount"];

        if (hasAllPermission) {
            // Full permission - can update all fields
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
            if (data.actualDurationMinutes !== undefined)
                updateData.actualDurationMinutes = data.actualDurationMinutes;
            if (data.tripType) updateData.tripType = data.tripType;
            if (data.notes !== undefined) updateData.notes = data.notes;
            if (data.hasAdditionalRider !== undefined) updateData.hasAdditionalRider = data.hasAdditionalRider;
            if (data.additionalRiderFirstName !== undefined) updateData.additionalRiderFirstName = data.additionalRiderFirstName;
            if (data.additionalRiderLastName !== undefined) updateData.additionalRiderLastName = data.additionalRiderLastName;
            if (data.relationshipToClient !== undefined) updateData.relationshipToClient = data.relationshipToClient;
            if (data.donationType !== undefined) updateData.donationType = data.donationType;
            if (data.donationAmount !== undefined) updateData.donationAmount = data.donationAmount;
            if (data.milesDriven !== undefined) updateData.milesDriven = data.milesDriven;
        } else {
            // Limited permission - only completion fields
            if (data.status) updateData.status = data.status;
            if (data.notes !== undefined) updateData.notes = data.notes;
            if (data.donationType !== undefined) updateData.donationType = data.donationType;
            if (data.donationAmount !== undefined) updateData.donationAmount = data.donationAmount;
            if (data.milesDriven !== undefined) updateData.milesDriven = data.milesDriven;
            if (data.estimatedDurationMinutes !== undefined) updateData.estimatedDurationMinutes = data.estimatedDurationMinutes;
            if (data.actualDurationMinutes !== undefined) updateData.actualDurationMinutes = data.actualDurationMinutes;

            // Reject if trying to update non-allowed fields
            const attemptedFields = Object.keys(data);
            const disallowedAttempts = attemptedFields.filter(
                (field) => !driverAllowedFields.includes(field) && field !== "customFields"
            );
            if (disallowedAttempts.length > 0) {
                return res.status(403).json({
                    message: "You can only update status and completion fields for your appointments",
                    disallowedFields: disallowedAttempts,
                });
            }
        }

        const [updated] = await db
            .update(appointments)
            .set(updateData)
            .where(eq(appointments.id, appointmentId))
            .returning();

        // No appointment with fetched ID
        if (!updated) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        let customFormFieldsRecord;
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
                    const appointmentCustomFormFields = await db
                        .update(customFormResponses)
                        .set({
                            responseData: data.customFields,
                            submittedBy: req.user?.id,
                            updatedAt: new Date().toISOString(),
                        })
                        .where(eq(customFormResponses.id, existingResponse.id));

                    customFormFieldsRecord = appointmentCustomFormFields;

                } else {
                    // Create new response
                    const appointmentCustomFormFields = await db.insert(customFormResponses).values({
                        formId: appointmentForm.id,
                        entityId: appointmentId,
                        entityType: "appointment",
                        responseData: data.customFields,
                        submittedBy: req.user?.id,
                    });

                    customFormFieldsRecord = appointmentCustomFormFields;
                }
            }
        }

        req.auditLog({
            actionType: "appointment.updated",
            objectId: updated.id,
            objectType: "appointment",
            actionMessage: `Appointment updated with ID ${updated.id}`,
            actionDetails: { 
                appointment: updated,
                customFormFields: customFormFieldsRecord || null,
             },
        });

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

        // 1. Fetch appointment with location details
        const pickupLocations = alias(locations, "pickup_locations");
        const destinationLocations = alias(locations, "destination_locations");

        const [appointment] = await db
            .select({
                id: appointments.id,
                clientId: appointments.clientId,
                startDate: appointments.startDate,
                startTime: appointments.startTime,
                estimatedDurationMinutes: appointments.estimatedDurationMinutes,
                hasAdditionalRider: appointments.hasAdditionalRider,
                pickupLocation: {
                    id: pickupLocations.id,
                    city: pickupLocations.city,
                    state: pickupLocations.state,
                    zip: pickupLocations.zip,
                },
                destinationLocation: {
                    id: destinationLocations.id,
                    city: destinationLocations.city,
                    state: destinationLocations.state,
                    zip: destinationLocations.zip,
                },
            })
            .from(appointments)
            .leftJoin(pickupLocations, eq(appointments.pickupLocation, pickupLocations.id))
            .leftJoin(destinationLocations, eq(appointments.destinationLocation, destinationLocations.id))
            .where(eq(appointments.id, appointmentId));

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // 2. Get client details for matching
        const [client] = await db
            .select({
                id: clients.id,
                firstName: clients.firstName,
                lastName: clients.lastName,
                mobilityEquipment: clients.mobilityEquipment,
                vehicleTypes: clients.vehicleTypes,
                hasOxygen: clients.hasOxygen,
                hasServiceAnimal: clients.hasServiceAnimal,
            })
            .from(clients)
            .where(eq(clients.id, appointment.clientId));

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        // 3. Get all active drivers with capabilities
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
                vehicleTypes: users.vehicleTypes,
                canAccommodateOxygen: users.canAccommodateOxygen,
                canAccommodateServiceAnimal: users.canAccommodateServiceAnimal,
                canAccommodateAdditionalRider: users.canAccommodateAdditionalRider,
                maxRidesPerWeek: users.maxRidesPerWeek,
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

        const driverIds = allDrivers.map((d) => d.id);

        // 4. Get unavailability blocks for all drivers
        const unavailabilityBlocks = driverIds.length > 0
            ? await db
                  .select()
                  .from(userUnavailability)
                  .where(inArray(userUnavailability.userId, driverIds))
            : [];

        // 5. Get current week ride counts
        const appointmentDate = new Date(appointment.startDate);
        const weekStart = startOfWeek(appointmentDate, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(appointmentDate, { weekStartsOn: 1 }); // Sunday

        const currentWeekRides = driverIds.length > 0
            ? await db
                  .select({
                      driverId: appointments.driverId,
                      rideCount: sql<number>`count(*)::int`,
                  })
                  .from(appointments)
                  .where(
                      and(
                          inArray(appointments.driverId, driverIds),
                          gte(appointments.startDate, weekStart.toISOString().split("T")[0]),
                          lte(appointments.startDate, weekEnd.toISOString().split("T")[0]),
                          inArray(appointments.status, ["Scheduled", "Completed"])
                      )
                  )
                  .groupBy(appointments.driverId)
            : [];

        // 6. Get concurrent rides (same date)
        const concurrentRides = await db
            .select({
                driverId: appointments.driverId,
                startTime: appointments.startTime,
                estimatedDurationMinutes: appointments.estimatedDurationMinutes,
            })
            .from(appointments)
            .where(
                and(
                    eq(appointments.startDate, appointment.startDate),
                    inArray(appointments.status, ["Scheduled", "Unassigned"])
                )
            );

        // Build lookup maps for performance
        const unavailabilityMap = new Map<string, UnavailabilityBlock[]>();
        for (const block of unavailabilityBlocks) {
            const existing = unavailabilityMap.get(block.userId) || [];
            existing.push(block as UnavailabilityBlock);
            unavailabilityMap.set(block.userId, existing);
        }

        const weekRidesMap = new Map<string, number>();
        for (const ride of currentWeekRides) {
            if (ride.driverId) {
                weekRidesMap.set(ride.driverId, ride.rideCount);
            }
        }

        // Check for time overlap in concurrent rides
        const concurrentRidesSet = new Set<string>();
        for (const ride of concurrentRides) {
            if (ride.driverId && checkTimeOverlap(
                appointment.startTime,
                appointment.estimatedDurationMinutes || 60,
                ride.startTime,
                ride.estimatedDurationMinutes || 60
            )) {
                concurrentRidesSet.add(ride.driverId);
            }
        }

        // Build matching context
        const context: MatchingContext = {
            appointment: {
                id: appointment.id,
                startDate: appointment.startDate,
                startTime: appointment.startTime,
                estimatedDurationMinutes: appointment.estimatedDurationMinutes,
                hasAdditionalRider: appointment.hasAdditionalRider,
                destinationLocation: {
                    city: appointment.destinationLocation?.city || "",
                    state: appointment.destinationLocation?.state || "",
                },
            },
            client: {
                mobilityEquipment: client.mobilityEquipment,
                vehicleTypes: client.vehicleTypes,
                hasOxygen: client.hasOxygen,
                hasServiceAnimal: client.hasServiceAnimal,
            },
            unavailabilityMap,
            weekRidesMap,
            concurrentRidesSet,
            allDriversWeekRides: currentWeekRides.map(r => ({
                driverId: r.driverId || "",
                rideCount: r.rideCount,
            })),
            allDriversMaxRides: allDrivers.map(d => ({
                driverId: d.id,
                maxRidesPerWeek: d.maxRidesPerWeek || 0,
            })),
        };

        // Score each driver
        const scoredDrivers = allDrivers
            .map((driver) => {
                const score = calculateDriverScore(driver, context);

                if (score === null) {
                    return null; // Driver failed hard requirements
                }

                const scoredDriver: ScoredDriver = {
                    ...driver,
                    matchScore: score,
                    matchReasons: generateMatchReasons(driver, score, context),
                    weeklyRideCount: weekRidesMap.get(driver.id) || 0,
                    scoreBreakdown: calculateScoreBreakdown(driver, context),
                    isPerfectMatch: isPerfectMatch(driver, context),
                };

                return scoredDriver;
            })
            .filter((driver): driver is ScoredDriver => driver !== null)
            .sort((a, b) => {
                // Primary sort: score descending
                if (b.matchScore !== a.matchScore) {
                    return b.matchScore - a.matchScore;
                }

                // Tiebreaker 1: weekly ride count ascending
                if (a.weeklyRideCount !== b.weeklyRideCount) {
                    return a.weeklyRideCount - b.weeklyRideCount;
                }

                // Tiebreaker 2: alphabetical by last name
                return a.lastName.localeCompare(b.lastName);
            })
            .slice(0, 10);

        return res.status(200).json({ results: scoredDrivers });
    } catch (err) {
        console.error("Error fetching matching drivers:", err);
        return res.status(500).send();
    }
};

/**
 * Helper function to check time overlap
 */
function checkTimeOverlap(
    start1: string,
    duration1: number,
    start2: string,
    duration2: number
): boolean {
    const toMinutes = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const start1Minutes = toMinutes(start1);
    const end1Minutes = start1Minutes + duration1;
    const start2Minutes = toMinutes(start2);
    const end2Minutes = start2Minutes + duration2;

    // Overlap if one starts before the other ends
    return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

export const notifyDrivers = async (req: Request, res: Response): Promise<Response> => {
    const { appointmentId } = req.params;
    const { driverIds, priority = "normal" } = req.body;

    try {
        const db = req.org?.db;
        if (!db) return res.status(400).json({ message: "Organization context missing" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Validate input
        if (!driverIds || !Array.isArray(driverIds) || driverIds.length === 0) {
            return res.status(400).json({ message: "Driver IDs are required" });
        }

        // Fetch the appointment with pickup and dropoff location details
        const pickupLocations = alias(locations, "pickup_locations");
        const dropoffLocations = alias(locations, "dropoff_locations");

        const [appointment] = await db
            .select({
                id: appointments.id,
                startDate: appointments.startDate,
                startTime: appointments.startTime,
                pickupAddress: sql<string>`CONCAT(
                    ${pickupLocations.addressLine1}, ', ',
                    ${pickupLocations.city}, ', ',
                    ${pickupLocations.state}, ' ',
                    ${pickupLocations.zip}
                )`,
                dropoffAddress: sql<string>`CONCAT(
                    ${dropoffLocations.addressLine1}, ', ',
                    ${dropoffLocations.city}, ', ',
                    ${dropoffLocations.state}, ' ',
                    ${dropoffLocations.zip}
                )`,
            })
            .from(appointments)
            .leftJoin(pickupLocations, eq(appointments.pickupLocation, pickupLocations.id))
            .leftJoin(dropoffLocations, eq(appointments.destinationLocation, dropoffLocations.id))
            .where(eq(appointments.id, appointmentId));

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Fetch driver details
        const drivers = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
            })
            .from(users)
            .where(inArray(users.id, driverIds));

        if (drivers.length === 0) {
            return res.status(404).json({ message: "No drivers found" });
        }

        // Create a message for this ride notification
        const subject = "New Ride Notification - Action Required";
        const body = `You have been notified about a new ride opportunity for ${appointment.startDate} at ${appointment.startTime}. Details will be sent in your daily notification email.`;

        const [message] = await db
            .insert(messages)
            .values({
                senderId: userId,
                appointmentId: appointmentId,
                messageType: "Email",
                subject,
                body,
                status: "pending",
                priority: priority as "normal" | "immediate",
                scheduledSendTime: null,
            })
            .returning({ id: messages.id });

        // Add all drivers as recipients
        await db.insert(messageRecipients).values(
            driverIds.map((driverId) => ({
                messageId: message.id,
                userId: driverId,
            }))
        );

        // If immediate priority, send emails now
        if (priority === "immediate") {
            let successCount = 0;
            let failureCount = 0;

            for (const driver of drivers) {
                const success = await sendDriverNotificationEmail(
                    driver.email,
                    `${driver.firstName} ${driver.lastName}`,
                    {
                        pickupAddress: appointment.pickupAddress || "Not specified",
                        dropoffAddress: appointment.dropoffAddress || "Not specified",
                        pickupTime: `${appointment.startDate} ${appointment.startTime}`,
                    }
                );

                if (success) {
                    successCount++;
                } else {
                    failureCount++;
                }
            }

            // Update message status
            await db
                .update(messages)
                .set({
                    status: failureCount === 0 ? "sent" : "failed",
                    sentAt: new Date().toISOString(),
                })
                .where(eq(messages.id, message.id));

            return res.status(200).json({
                message: `Immediate notifications sent to ${successCount} driver(s)${failureCount > 0 ? `, ${failureCount} failed` : ""}`,
                successCount,
                failureCount,
            });
        }

        return res.status(200).json({
            message: `Notifications queued for ${driverIds.length} driver(s)`,
            queuedCount: driverIds.length,
        });
    } catch (err) {
        console.error("Error notifying drivers:", err);
        return res.status(500).json({ message: "Failed to send notifications" });
    }
};

export const acceptAppointment = async (req: Request, res: Response): Promise<Response> => {
    const { appointmentId } = req.params;

    /**@TODO add logging for audit log, maybe */

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
            return res
                .status(400)
                .json({ message: "This ride has already been assigned to a driver" });
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
