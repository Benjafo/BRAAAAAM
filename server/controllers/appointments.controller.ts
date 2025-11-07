import { and, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Request, Response } from "express";
import {
    appointments,
    clients,
    customFormResponses,
    customForms,
    locations,
    users,
} from "../drizzle/org/schema.js";
import { findOrCreateLocation } from "../utils/locations.js";
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

        // Create aliases for pickup and destination locations to join both
        const pickupLocations = alias(locations, "pickup_locations");
        const destinationLocations = alias(locations, "destination_locations");

        // Search + Sort + Pagination
        const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(req, [
            appointments.startDate,
            appointments.startTime,
        ]);

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(appointments)
            .where(where);

        const allAppointments = await db
            .select({
                id: appointments.id,
                date: appointments.startDate,
                time: appointments.startTime,
                status: appointments.status,
                clientId: appointments.clientId,
                clientFirstName: clients.firstName,
                clientLastName: clients.lastName,
                driverId: appointments.driverId,
                dispatcherId: appointments.dispatcherId,
                dispatcherFirstName: users.firstName,
                dispatcherLastName: users.lastName,
                tripPurpose: appointments.tripPurpose,
                tripCount: appointments.tripCount,
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
            .leftJoin(pickupLocations, eq(appointments.pickupLocation, pickupLocations.id))
            .leftJoin(
                destinationLocations,
                eq(appointments.destinationLocation, destinationLocations.id)
            )
            .where(where)
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
                tripCount: data.tripCount || 1,
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
                    and(
                        eq(customForms.targetEntity, "appointment"),
                        eq(customForms.isActive, true)
                    )
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
        if (data.tripCount) updateData.tripCount = data.tripCount;
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
                    and(
                        eq(customForms.targetEntity, "appointment"),
                        eq(customForms.isActive, true)
                    )
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
