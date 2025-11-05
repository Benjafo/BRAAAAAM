import { eq, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { locations, roles, users } from "../drizzle/org/schema.js";
import { findOrCreateLocation } from "../utils/locations.js";
import { hashPassword } from "../utils/password.js";
import { applyQueryFilters } from "../utils/queryParams.js";

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

        // Search + Sort + Pagination
        const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(req, [
            users.firstName,
            users.lastName,
            users.email,
            users.phone,
        ]);

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(users)
            .where(where);

        const data = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                phone: users.phone,
                contactPreference: users.contactPreference,
                birthYear: users.birthYear,
                birthMonth: users.birthMonth,
                emergencyContactName: users.emergencyContactName,
                emergencyContactPhone: users.emergencyContactPhone,
                emergencyContactRelationship: users.emergencyContactRelationship,
                isActive: users.isActive,
                isDriver: users.isDriver,
                roleId: users.roleId,
                roleName: roles.name,
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
            .where(where)
            .orderBy(...(orderBy.length > 0 ? orderBy : []))
            .limit(limit)
            .offset(offset);

        return res.status(200).json({
            page,
            pageSize,
            total: Number(total),
            results: data,
        });
    } catch (err) {
        console.error("Error listing users:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const createUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const {
            firstName,
            lastName,
            email,
            phone,
            contactPreference,
            birthYear,
            birthMonth,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelationship,
            _notes,
            isActive,
            isDriver,
            roleId,
            address,
        } = req.body;

        if (!firstName || !lastName || !email || !phone) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        /**
         * @TODO Add notes to users org schema and include in below query
         */

        // TODO DO NOT COMMIT!!!! TESTING ONLY!
        // ADDING THIS SO I CAN TEST CUSTOM ROLE PERMISSIONS. THIS SHOULD BE REMOVED.
        const passwordHash = await hashPassword("Password123!");

        // Create or get location if address provided
        let addressId: string | null = null;
        if (address) {
            addressId = await findOrCreateLocation(db, address);
        }

        const [newUser] = await db
            .insert(users)
            .values({
                firstName,
                lastName,
                email,
                phone,
                contactPreference,
                birthYear,
                birthMonth,
                emergencyContactName,
                emergencyContactPhone,
                emergencyContactRelationship,
                passwordHash, // TODO DO NOT COMMIT!!!!! TESTING ONLY!! REMOVE THIS!!!
                addressLocation: addressId ?? undefined,
                roleId: roleId ?? undefined,
                isActive: isActive ?? true,
                isDriver: isDriver ?? false,
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
                birthYear: users.birthYear,
                birthMonth: users.birthMonth,
                emergencyContactName: users.emergencyContactName,
                emergencyContactPhone: users.emergencyContactPhone,
                emergencyContactRelationship: users.emergencyContactRelationship,
                isActive: users.isActive,
                isDriver: users.isDriver,
                roleId: users.roleId,
                roleName: roles.name,
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

        // Create or get location if address provided
        let addressId: string | null | undefined = undefined;
        if (data.address) {
            addressId = await findOrCreateLocation(db, data.address);
        }

        const [updatedUser] = await db
            .update(users)
            .set({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                contactPreference: data.contactPreference,
                birthYear: data.birthYear,
                birthMonth: data.birthMonth,
                emergencyContactName: data.emergencyContactName,
                emergencyContactPhone: data.emergencyContactPhone,
                emergencyContactRelationship: data.emergencyContactRelationship,
                isActive: data.isActive,
                isDriver: data.isDriver,
                ...(data.roleId !== undefined && { roleId: data.roleId }),
                ...(addressId !== undefined && { addressLocation: addressId }),
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
