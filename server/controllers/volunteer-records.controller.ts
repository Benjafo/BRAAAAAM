import { and, eq, gte, lte, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { users, volunteerRecords } from "../drizzle/org/schema.js";
import { applyQueryFilters } from "../utils/queryParams.js";

/**
 * List volunteer records for a specific user with pagination, sorting, and filtering
 * Uses scoped permissions (own vs all)
 */
export const listVolunteerRecordsByUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Get userId from route params (scoped permission middleware validates access)
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        // Define searchable and sortable columns
        const searchableColumns = [volunteerRecords.description];

        const sortableColumns: Record<string, any> = {
            date: volunteerRecords.date,
            hours: volunteerRecords.hours,
            miles: volunteerRecords.miles,
            createdAt: volunteerRecords.createdAt,
        };

        const filterableColumns: Record<string, any> = {
            date: volunteerRecords.date,
            description: volunteerRecords.description,
        };

        const { where: filterWhere, orderBy, limit, offset, page, pageSize } = applyQueryFilters(
            req,
            searchableColumns,
            sortableColumns,
            filterableColumns
        );

        // Additional filters
        const filters: any[] = [filterWhere, eq(volunteerRecords.userId, userId)];

        // Filter by date range if provided
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        if (startDate) {
            filters.push(gte(volunteerRecords.date, startDate));
        }
        if (endDate) {
            filters.push(lte(volunteerRecords.date, endDate));
        }

        const finalWhere = and(...filters);

        // Get total count
        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(volunteerRecords)
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
 * List all volunteer records with user info (admin/dispatcher view)
 * Requires allvolunteer-records.read permission
 */
export const listAllVolunteerRecords = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Define searchable and sortable columns
        const searchableColumns = [volunteerRecords.description, users.firstName, users.lastName, users.email];

        const sortableColumns: Record<string, any> = {
            date: volunteerRecords.date,
            hours: volunteerRecords.hours,
            miles: volunteerRecords.miles,
            volunteer: users.firstName,
            createdAt: volunteerRecords.createdAt,
        };

        const filterableColumns: Record<string, any> = {
            date: volunteerRecords.date,
            volunteer: [users.firstName, users.lastName, users.email],
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
        console.error("Error listing all volunteer records:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Create a new volunteer record
 * Can create records for specified user (based on permissions)
 */
export const createVolunteerRecord = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const currentUserId = req.user?.id;
        if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });

        // Get userId from route params (scoped permission middleware validates access)
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

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
        let milesStr: string | null = null;
        if (miles !== null && miles !== undefined && miles !== "") {
            const milesNum = parseFloat(miles);
            if (isNaN(milesNum) || milesNum < 0) {
                return res.status(400).json({ message: "Miles must be a non-negative number" });
            }
            milesStr = milesNum.toString();
        }

        // Create record for the specified user
        const [newRecord] = await db
            .insert(volunteerRecords)
            .values({
                userId: userId,
                date,
                hours: hoursNum.toString(),
                miles: milesStr,
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
 * Uses scoped permissions
 */
export const getVolunteerRecord = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Get userId and recordId from route params (scoped permission middleware validates access)
        const { userId, recordId } = req.params;
        if (!userId || !recordId) {
            return res.status(400).json({ error: "User ID and Record ID are required" });
        }

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
            .where(and(eq(volunteerRecords.id, recordId), eq(volunteerRecords.userId, userId)));

        if (!record) {
            return res.status(404).json({ message: "Volunteer record not found" });
        }

        return res.status(200).json(record);
    } catch (err) {
        console.error("Error fetching volunteer record:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update a volunteer record
 * Uses scoped permissions
 */
export const updateVolunteerRecord = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Get userId and recordId from route params (scoped permission middleware validates access)
        const { userId, recordId } = req.params;
        if (!userId || !recordId) {
            return res.status(400).json({ error: "User ID and Record ID are required" });
        }

        const { date, hours, miles, description } = req.body;

        // First, fetch the existing record to verify it belongs to the userId
        const [existingRecord] = await db
            .select()
            .from(volunteerRecords)
            .where(and(eq(volunteerRecords.id, recordId), eq(volunteerRecords.userId, userId)));

        if (!existingRecord) {
            return res.status(404).json({ message: "Volunteer record not found" });
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
        let milesStr: string | null | undefined = undefined;
        if (miles !== undefined) {
            if (miles === null || miles === "") {
                milesStr = null;
            } else {
                const parsedMiles = parseFloat(miles);
                if (isNaN(parsedMiles) || parsedMiles < 0) {
                    return res.status(400).json({ message: "Miles must be a non-negative number" });
                }
                milesStr = parsedMiles.toString();
            }
        }

        // Update the record
        const [updatedRecord] = await db
            .update(volunteerRecords)
            .set({
                ...(date !== undefined && { date }),
                ...(hoursNum !== undefined && { hours: hoursNum }),
                ...(milesStr !== undefined && { miles: milesStr }),
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
 * Uses scoped permissions
 */
export const deleteVolunteerRecord = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Get userId and recordId from route params (scoped permission middleware validates access)
        const { userId, recordId } = req.params;
        if (!userId || !recordId) {
            return res.status(400).json({ error: "User ID and Record ID are required" });
        }

        // Delete the record (only if it belongs to the userId)
        const result = await db
            .delete(volunteerRecords)
            .where(and(eq(volunteerRecords.id, recordId), eq(volunteerRecords.userId, userId)));

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Volunteer record not found" });
        }

        return res.status(204).send();
    } catch (err) {
        console.error("Error deleting volunteer record:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
