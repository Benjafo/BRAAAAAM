import { and, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Request, Response } from "express";
import { appointments, clients, locations, users } from "../drizzle/org/schema.js";
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

// Find or create a location
const findOrCreateLocation = async (db: any, address: any): Promise<string> => {
    const addr1 = address.addressLine1?.trim() ?? "";
    const addr2 = address.addressLine2?.trim() || null;
    const city = address.city?.trim() ?? "";
    const state = address.state?.trim() ?? "";
    const zip = address.zip?.trim() ?? "";
    const country = address.country?.trim() ?? "";

    // Look for existing location with same full address
    // Note: SQL NULL comparisons require IS NULL, not = NULL
    const [existingLocation] = await db
        .select({ id: locations.id })
        .from(locations)
        .where(
            and(
                eq(locations.addressLine1, addr1),
                addr2 === null ? isNull(locations.addressLine2) : eq(locations.addressLine2, addr2),
                eq(locations.city, city),
                eq(locations.state, state),
                eq(locations.zip, zip),
                eq(locations.country, country)
            )
        );

    if (existingLocation) {
        return existingLocation.id;
    }

    // No existing match, make new location
    const [newLocation] = await db
        .insert(locations)
        .values({
            addressLine1: addr1,
            addressLine2: addr2,
            city,
            state,
            zip,
            country,
        })
        .returning({ id: locations.id });

    return newLocation.id;
};

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

        return res.status(200).json({
            page,
            pageSize,
            total: Number(total),
            results: allAppointments,
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

        return res.status(200).json(appointment);
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

        const updateData: any = {};
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

        return res.status(200).json(updated);
    } catch (err) {
        console.error("Error updating appointment:", err);
        return res.status(500).send();
    }
};
