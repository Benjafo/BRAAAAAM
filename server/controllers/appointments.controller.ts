import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { appointments } from "../drizzle/org/schema";

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

        const allAppointments = await db.select().from(appointments);
        return res.status(200).json(allAppointments);
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
        !data.pickupLocation ||
        !data.destinationLocation
    ) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const db = req.org?.db;
        if (!db) return res.status(400).json({ message: "Organization context missing" });

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
                pickupLocation: data.pickupLocation,
                destinationLocation: data.destinationLocation,
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

        const [updated] = await db
            .update(appointments)
            .set(data)
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
}
