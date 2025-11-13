import { and, eq, gte, lte, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { users, volunteerRecords } from "../drizzle/org/schema.js";
import { hasPermission } from "../utils/permissions.js";
import { applyQueryFilters } from "../utils/queryParams.js";

/**
 * List volunteer records with pagination, sorting, and filtering
 * Filters by userId if user only has OWN permissions
 */
export const listVolunteerRecords = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Check if user has ALL or OWN permissions
        const hasAllPermission = await hasPermission(userId, "allvolunteer-records.read", db);

        // Define searchable and sortable columns
        // Cast date to text for searching since ilike doesn't work on date types
        const searchableColumns = [volunteerRecords.description, users.firstName, users.lastName];

        const sortableColumns: Record<string, any> = {
            date: volunteerRecords.date,
            hours: volunteerRecords.hours,
            miles: volunteerRecords.miles,
            volunteer: users.firstName,
            createdAt: volunteerRecords.createdAt,
        };

        const filterableColumns: Record<string, any> = {
            date: volunteerRecords.date,
            volunteer: [users.firstName, users.lastName], // Filter by both firstName and lastName
            description: volunteerRecords.description,
        };

        const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(
            req,
            searchableColumns,
            sortableColumns,
            filterableColumns
        );

        // Additional filters
        const filters: any[] = [where];

        // Filter by userId from query if provided (admin only)
        const filterUserId = req.query.userId as string | undefined;
        if (filterUserId && hasAllPermission) {
            filters.push(eq(volunteerRecords.userId, filterUserId));
        } else if (!hasAllPermission) {
            // If user only has OWN permission, restrict to their records
            filters.push(eq(volunteerRecords.userId, userId));
        }

        // Filter by date range if provided
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        if (startDate) {
            filters.push(gte(volunteerRecords.date, startDate));
        }
        if (endDate) {
            filters.push(lte(volunteerRecords.date, endDate));
        }

        const finalWhere = filters.length > 1 ? and(...filters) : filters[0];

        // Get total count
        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(volunteerRecords)
            .leftJoin(users, eq(volunteerRecords.userId, users.id))
            .where(finalWhere);

        // Fetch data with user join
        const data = await db
            .select({
                id: volunteerRecords.id,
                userId: volunteerRecords.userId,
                date: volunteerRecords.date,
                hours: volunteerRecords.hours,
                miles: volunteerRecords.miles,
                description: volunteerRecords.description,
                createdAt: volunteerRecords.createdAt,
                updatedAt: volunteerRecords.updatedAt,
                createdByUserId: volunteerRecords.createdByUserId,
                volunteer: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                },
            })
            .from(volunteerRecords)
            .leftJoin(users, eq(volunteerRecords.userId, users.id))
            .where(finalWhere)
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);

        return res.status(200).json({
            page,
            pageSize,
            total: Number(total),
            results: data,
        });
    } catch (err) {
        console.error("Error listing volunteer records:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Create a new volunteer record
 * Users can only create records for themselves
 */
export const createVolunteerRecord = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const currentUserId = req.user?.id;
        if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });

        const { date, hours, miles, description } = req.body;

        // Validate required fields
        if (!date || hours === undefined) {
            return res.status(400).json({ message: "Missing required fields: date, hours" });
        }

        // Validate hours (must be positive)
        const hoursNum = parseFloat(hours);
        if (isNaN(hoursNum) || hoursNum <= 0) {
            return res.status(400).json({ message: "Hours must be a positive number" });
        }

        // Validate miles if provided (must be non-negative)
        let milesNum: number | null = null;
        if (miles !== null && miles !== undefined && miles !== "") {
            milesNum = parseInt(miles);
            if (isNaN(milesNum) || milesNum < 0) {
                return res.status(400).json({ message: "Miles must be a non-negative number" });
            }
        }

        // Users can only create records for themselves
        // The userId is set to the current user, not from request body
        const [newRecord] = await db
            .insert(volunteerRecords)
            .values({
                userId: currentUserId,
                date,
                hours: hoursNum.toString(),
                miles: milesNum,
                description: description || null,
                createdByUserId: currentUserId,
            })
            .returning();

        return res.status(201).json(newRecord);
    } catch (err) {
        console.error("Error creating volunteer record:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get a single volunteer record by ID
 */
export const getVolunteerRecord = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { recordId } = req.params;

        // Check permissions
        const hasAllPermission = await hasPermission(userId, "allvolunteer-records.read", db);

        // Fetch the record with volunteer info
        const [record] = await db
            .select({
                id: volunteerRecords.id,
                userId: volunteerRecords.userId,
                date: volunteerRecords.date,
                hours: volunteerRecords.hours,
                miles: volunteerRecords.miles,
                description: volunteerRecords.description,
                createdAt: volunteerRecords.createdAt,
                updatedAt: volunteerRecords.updatedAt,
                createdByUserId: volunteerRecords.createdByUserId,
                volunteer: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                },
            })
            .from(volunteerRecords)
            .leftJoin(users, eq(volunteerRecords.userId, users.id))
            .where(eq(volunteerRecords.id, recordId));

        if (!record) {
            return res.status(404).json({ message: "Volunteer record not found" });
        }

        // If user only has OWN permission, verify they own this record
        if (!hasAllPermission && record.userId !== userId) {
            return res.status(403).json({ message: "You can only view your own records" });
        }

        return res.status(200).json(record);
    } catch (err) {
        console.error("Error fetching volunteer record:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update a volunteer record
 */
export const updateVolunteerRecord = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { recordId } = req.params;
        const { date, hours, miles, description } = req.body;

        // Check permissions
        const hasAllPermission = await hasPermission(userId, "allvolunteer-records.update", db);

        // First, fetch the existing record to check ownership
        const [existingRecord] = await db
            .select()
            .from(volunteerRecords)
            .where(eq(volunteerRecords.id, recordId));

        if (!existingRecord) {
            return res.status(404).json({ message: "Volunteer record not found" });
        }

        // If user only has OWN permission, verify they own this record
        if (!hasAllPermission && existingRecord.userId !== userId) {
            return res.status(403).json({ message: "You can only update your own records" });
        }

        // Validate hours if provided
        let hoursNum: string | undefined = undefined;
        if (hours !== undefined) {
            const parsedHours = parseFloat(hours);
            if (isNaN(parsedHours) || parsedHours <= 0) {
                return res.status(400).json({ message: "Hours must be a positive number" });
            }
            hoursNum = parsedHours.toString();
        }

        // Validate miles if provided
        let milesNum: number | null | undefined = undefined;
        if (miles !== undefined) {
            if (miles === null || miles === "") {
                milesNum = null;
            } else {
                const parsedMiles = parseInt(miles);
                if (isNaN(parsedMiles) || parsedMiles < 0) {
                    return res.status(400).json({ message: "Miles must be a non-negative number" });
                }
                milesNum = parsedMiles;
            }
        }

        // Update the record
        const [updatedRecord] = await db
            .update(volunteerRecords)
            .set({
                ...(date !== undefined && { date }),
                ...(hoursNum !== undefined && { hours: hoursNum }),
                ...(milesNum !== undefined && { miles: milesNum }),
                ...(description !== undefined && { description }),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(volunteerRecords.id, recordId))
            .returning();

        return res.status(200).json(updatedRecord);
    } catch (err) {
        console.error("Error updating volunteer record:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Delete a volunteer record
 */
export const deleteVolunteerRecord = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { recordId } = req.params;

        // Check permissions
        const hasAllPermission = await hasPermission(userId, "allvolunteer-records.delete", db);

        // First, fetch the existing record to check ownership
        const [existingRecord] = await db
            .select()
            .from(volunteerRecords)
            .where(eq(volunteerRecords.id, recordId));

        if (!existingRecord) {
            return res.status(404).json({ message: "Volunteer record not found" });
        }

        // If user only has OWN permission, verify they own this record
        if (!hasAllPermission && existingRecord.userId !== userId) {
            return res.status(403).json({ message: "You can only delete your own records" });
        }

        // Delete the record
        await db.delete(volunteerRecords).where(eq(volunteerRecords.id, recordId));

        return res.status(204).send();
    } catch (err) {
        console.error("Error deleting volunteer record:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
