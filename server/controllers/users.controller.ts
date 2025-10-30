import { Request, Response } from "express";
import { users } from "../drizzle/org/schema.js";
import { eq } from "drizzle-orm";

/*
 * Example User Output
    {
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "phone": "string"
    }
 * Example Unavailability Output
    {
        "startDate": "string",
        "startTime": "string",
        "endDate": "string",
        "endTime": "string"
    }
 */

// Interfaces for documentation and typing (still fine to keep for clarity)
// interface Unavailability {
//     id: string;
//     startDate: string;
//     startTime?: string;
//     endDate: string;
//     endTime?: string;
// }

// interface User {
//     id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone: string;
//     contactPreference?: string;
//     notes?: string;
//     isActive?: boolean;
//     unavailability?: Unavailability[];
// }

// -----------------------------
//  User CRUD
// -----------------------------

export const listUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const data = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                phone: users.phone,
                contactPreference: users.contactPreference,
                isActive: users.isActive,
                isDriver: users.isDriver,
            })
            .from(users);

        return res.status(200).json(data);
    } catch (err) {
        console.error("Error listing users:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const createUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { firstName, lastName, email, phone, contactPreference, _notes, isActive } = req.body;

        if (!firstName || !lastName || !email || !phone) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        /**
         * @TODO Add notes to users org schema and include in below query
         */

        const [newUser] = await db
            .insert(users)
            .values({
                firstName,
                lastName,
                email,
                phone,
                contactPreference,
                isActive: isActive ?? true,
                isDriver: false,
                isDeleted: false,
            })
            .returning();

        return res.status(201).json(newUser);
    } catch (err) {
        console.error("Error creating user:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { userId } = req.params;

        const [userData] = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                phone: users.phone,
                contactPreference: users.contactPreference,
                isActive: users.isActive,
                isDriver: users.isDriver,
            })
            .from(users)
            .where(eq(users.id, userId));

        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(userData);
    } catch (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { userId } = req.params;
        const data = req.body;

        const [updatedUser] = await db
            .update(users)
            .set({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                contactPreference: data.contactPreference,
                isActive: data.isActive,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(users.id, userId))
            .returning();

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(updatedUser);
    } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { userId } = req.params;

        const result = await db.delete(users).where(eq(users.id, userId));

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(204).send();
    } catch (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

//  Unavailability - Stubs; not in Drizzle Schema?
export const createUnavailability = async (req: Request, res: Response): Promise<Response> => {
    try {
        return res.status(500).json({ message: "Not implemented" });
    } catch (err) {
        console.error("Error creating unavailability:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const listUnavailability = async (req: Request, res: Response): Promise<Response> => {
    try {
        return res.status(500).json({ message: "Not implemented" });
    } catch (err) {
        console.error("Error listing unavailability:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUnavailability = async (req: Request, res: Response): Promise<Response> => {
    try {
        return res.status(500).json({ message: "Not implemented" });
    } catch (err) {
        console.error("Error updating unavailability:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteUnavailability = async (req: Request, res: Response): Promise<Response> => {
    try {
        return res.status(500).json({ message: "Not implemented" });
    } catch (err) {
        console.error("Error deleting unavailability:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
