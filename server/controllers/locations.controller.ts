import { Request, Response } from "express";
import { locations } from "../drizzle/org/schema.js";
import { eq, sql } from "drizzle-orm";
import { applyQueryFilters } from "../utils/queryParams.js";

/*
 * Example Location Output
  {
    "aliasName": "Office HQ",
    "addressLine1": "123 Main St",
    "addressLine2": "Suite 400",
    "city": "Rochester",
    "state": "NY",
    "zip": "14623",
    "country": "USA"
  }
 */

export const listLocations = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        // Does org DB Connection exist?
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Search + Sort + Pagaination
        const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(req, [
            locations.aliasName,
            locations.addressLine1,
            locations.addressLine2,
            locations.city,
            locations.state,
            locations.zip,
            locations.country,
        ]);

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(locations)
            .where(where);

        // Select all location records
        let query = db
            .select({
                id: locations.id,
                aliasName: locations.aliasName,
                addressLine1: locations.addressLine1,
                addressLine2: locations.addressLine2,
                city: locations.city,
                state: locations.state,
                zip: locations.zip,
                country: locations.country,
                addressValidated: locations.addressValidated,
                createdAt: locations.createdAt,
                updatedAt: locations.updatedAt,
            })
            .from(locations)
            .where(where)
            .orderBy(...(orderBy.length > 0 ? orderBy : []))
            .limit(limit)
            .offset(offset);

        const data = await query;

        return res.status(200).json({
            page,
            pageSize,
            total: Number(total),
            results: data,
        });
    } catch (err) {
        console.error("Error listing locations:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const createLocation = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { aliasName, addressLine1, addressLine2, city, state, zip, country } = req.body;

        // Validate all required fields are provided
        if (!aliasName || !addressLine1 || !city || !state || !zip || !country) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Insert new location record
        const [newLocation] = await db
            .insert(locations)
            .values({
                aliasName,
                addressLine1,
                addressLine2,
                city,
                state,
                zip,
                country,
                addressValidated: false, // Defaulted; can be updated later if validated externally
            })
            .returning();

        return res.status(201).json(newLocation);
    } catch (err) {
        console.error("Error creating location:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getLocation = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { locationId } = req.params;

        // Fetch location by ID
        const [locationData] = await db
            .select({
                id: locations.id,
                aliasName: locations.aliasName,
                addressLine1: locations.addressLine1,
                addressLine2: locations.addressLine2,
                city: locations.city,
                state: locations.state,
                zip: locations.zip,
                country: locations.country,
                addressValidated: locations.addressValidated,
                createdAt: locations.createdAt,
                updatedAt: locations.updatedAt,
            })
            .from(locations)
            .where(eq(locations.id, locationId));

        // If not found, return 404
        if (!locationData) {
            return res.status(404).json({ message: "Location not found" });
        }

        return res.status(200).json(locationData);
    } catch (err) {
        console.error("Error fetching location:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateLocation = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { locationId } = req.params;
        const data = req.body;

        // Update only provided fields
        const [updatedLocation] = await db
            .update(locations)
            .set({
                aliasName: data.aliasName,
                addressLine1: data.addressLine1,
                addressLine2: data.addressLine2,
                city: data.city,
                state: data.state,
                zip: data.zip,
                country: data.country,
                addressValidated: data.addressValidated,
                updatedAt: new Date().toISOString(), // Update timestamp manually
            })
            .where(eq(locations.id, locationId))
            .returning();

        // No matching record found
        if (!updatedLocation) {
            return res.status(404).json({ message: "Location not found" });
        }

        return res.status(200).json(updatedLocation);
    } catch (err) {
        console.error("Error updating location:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteLocation = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { locationId } = req.params;

        // Delete record by ID
        const result = await db.delete(locations).where(eq(locations.id, locationId));

        // Ensure record actually deleted
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Location not found" });
        }

        return res.status(204).send();
    } catch (err) {
        console.error("Error deleting location:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
