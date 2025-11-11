import { and, eq, inArray, or, sql } from "drizzle-orm";
import { Request, Response } from "express";
import {
    customFormResponses,
    customForms,
    locations,
    roles,
    users,
    userUnavailability,
} from "../drizzle/org/schema.js";
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

        // Fetch custom field responses for all users
        const userIds = data.map((user) => user.id);
        const customFieldResponses =
            userIds.length > 0
                ? await db
                      .select()
                      .from(customFormResponses)
                      .where(
                          and(
                              eq(customFormResponses.entityType, "user"),
                              inArray(customFormResponses.entityId, userIds)
                          )
                      )
                : [];

        // Create a map of userId -> customFields
        const customFieldsMap = new Map();
        for (const response of customFieldResponses) {
            customFieldsMap.set(response.entityId, response.responseData);
        }

        // Add customFields to each user
        const resultsWithCustomFields = data.map((user) => ({
            ...user,
            customFields: customFieldsMap.get(user.id) || {},
        }));

        return res.status(200).json({
            page,
            pageSize,
            total: Number(total),
            results: resultsWithCustomFields,
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

        // Save custom field responses if provided
        const customFields = req.body.customFields;
        if (customFields && Object.keys(customFields).length > 0) {
            const [userForm] = await db
                .select()
                .from(customForms)
                .where(and(eq(customForms.targetEntity, "user"), eq(customForms.isActive, true)));

            if (userForm) {
                await db.insert(customFormResponses).values({
                    formId: userForm.id,
                    entityId: newUser.id,
                    entityType: "user",
                    responseData: customFields,
                    submittedBy: req.user?.id,
                });
            }
        }

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

        // Fetch custom field responses
        const [response] = await db
            .select()
            .from(customFormResponses)
            .where(and(eq(customFormResponses.entityId, userId), eq(customFormResponses.entityType, "user")));

        const userWithCustomFields = {
            ...userData,
            customFields: response?.responseData || {},
        };

        return res.status(200).json(userWithCustomFields);
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

        // Update custom field responses if provided
        const customFields = req.body.customFields;
        if (customFields) {
            const [userForm] = await db
                .select()
                .from(customForms)
                .where(and(eq(customForms.targetEntity, "user"), eq(customForms.isActive, true)));

            if (userForm) {
                const userId = req.params.userId;
                // Check if response already exists
                const [existingResponse] = await db
                    .select()
                    .from(customFormResponses)
                    .where(
                        and(
                            eq(customFormResponses.formId, userForm.id),
                            eq(customFormResponses.entityId, userId),
                            eq(customFormResponses.entityType, "user")
                        )
                    );

                if (existingResponse) {
                    // Update existing response
                    await db
                        .update(customFormResponses)
                        .set({
                            responseData: customFields,
                            submittedBy: req.user?.id,
                            updatedAt: new Date().toISOString(),
                        })
                        .where(eq(customFormResponses.id, existingResponse.id));
                } else {
                    // Create new response
                    await db.insert(customFormResponses).values({
                        formId: userForm.id,
                        entityId: userId,
                        entityType: "user",
                        responseData: customFields,
                        submittedBy: req.user?.id,
                    });
                }
            }
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

//  Unavailability
type UnavailabilityBlock = typeof userUnavailability.$inferSelect;

/**
 * Helper function to detect overlapping unavailability blocks
 */
async function checkOverlaps(
    db: any,
    userId: string,
    newBlock: {
        startDate: string;
        endDate: string;
        startTime: string | null;
        endTime: string | null;
        isAllDay: boolean;
        isRecurring: boolean;
        recurringDayOfWeek?: string | null;
    },
    excludeId?: string
): Promise<UnavailabilityBlock[]> {
    // Get all existing blocks for this user
    let existingBlocks = await db
        .select()
        .from(userUnavailability)
        .where(
            excludeId
                ? and(
                      eq(userUnavailability.userId, userId),
                      sql`${userUnavailability.id} != ${excludeId}`
                  )
                : eq(userUnavailability.userId, userId)
        );

    const conflicts: UnavailabilityBlock[] = [];

    for (const existing of existingBlocks) {
        let hasOverlap = false;

        if (!newBlock.isRecurring && !existing.isRecurring) {
            // Temporary vs Temporary: Check date range overlap
            const newStart = new Date(newBlock.startDate);
            const newEnd = new Date(newBlock.endDate);
            const existingStart = new Date(existing.startDate);
            const existingEnd = new Date(existing.endDate);

            const dateOverlap = newStart <= existingEnd && newEnd >= existingStart;

            if (dateOverlap) {
                // Check time overlap if not all-day
                if (newBlock.isAllDay || existing.isAllDay) {
                    hasOverlap = true;
                } else if (newBlock.startTime && newBlock.endTime && existing.startTime && existing.endTime) {
                    const timeOverlap =
                        newBlock.startTime < existing.endTime && newBlock.endTime > existing.startTime;
                    hasOverlap = timeOverlap;
                } else {
                    hasOverlap = true;
                }
            }
        } else if (newBlock.isRecurring && existing.isRecurring) {
            // Recurring vs Recurring: Check if same day of week with overlapping time
            if (newBlock.recurringDayOfWeek === existing.recurringDayOfWeek) {
                if (newBlock.isAllDay || existing.isAllDay) {
                    hasOverlap = true;
                } else if (newBlock.startTime && newBlock.endTime && existing.startTime && existing.endTime) {
                    const timeOverlap =
                        newBlock.startTime < existing.endTime && newBlock.endTime > existing.startTime;
                    hasOverlap = timeOverlap;
                }
            }
        } else {
            // Temporary vs Recurring or Recurring vs Temporary
            const tempBlock = newBlock.isRecurring ? existing : newBlock;
            const recurBlock = newBlock.isRecurring ? newBlock : existing;

            // Check if temp block falls on the recurring day
            const tempStart = new Date(tempBlock.startDate);
            const tempEnd = new Date(tempBlock.endDate);

            // Get day of week for temp block (0=Sunday, 1=Monday, etc.)
            const daysOfWeek = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ];

            // Check all dates in temp block range
            for (let d = new Date(tempStart); d <= tempEnd; d.setDate(d.getDate() + 1)) {
                const dayName = daysOfWeek[d.getDay()];
                if (dayName === recurBlock.recurringDayOfWeek) {
                    // Day matches, check time overlap
                    if (tempBlock.isAllDay || recurBlock.isAllDay) {
                        hasOverlap = true;
                        break;
                    } else if (
                        tempBlock.startTime &&
                        tempBlock.endTime &&
                        recurBlock.startTime &&
                        recurBlock.endTime
                    ) {
                        const timeOverlap =
                            tempBlock.startTime < recurBlock.endTime &&
                            tempBlock.endTime > recurBlock.startTime;
                        if (timeOverlap) {
                            hasOverlap = true;
                            break;
                        }
                    }
                }
            }
        }

        if (hasOverlap) {
            conflicts.push(existing);
        }
    }

    return conflicts;
}

export const createUnavailability = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { userId } = req.params;

        const { startDate, endDate, startTime, endTime, isAllDay, reason, isRecurring, recurringDayOfWeek } =
            req.body;

        // Validate required fields
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "Start date and end date are required" });
        }

        // Check for overlaps unless ignoreOverlap flag is set
        const ignoreOverlap = req.query.ignoreOverlap === "true";
        if (!ignoreOverlap) {
            const conflicts = await checkOverlaps(db, userId, {
                startDate,
                endDate,
                startTime: startTime || null,
                endTime: endTime || null,
                isAllDay: isAllDay || false,
                isRecurring: isRecurring || false,
                recurringDayOfWeek: recurringDayOfWeek || null,
            });

            if (conflicts.length > 0) {
                return res.status(409).json({
                    error: "overlap_detected",
                    message: "This unavailability overlaps with existing blocks",
                    conflicts,
                });
            }
        }

        // Insert the unavailability block
        const [newBlock] = await db
            .insert(userUnavailability)
            .values({
                userId,
                startDate,
                endDate,
                startTime: startTime || null,
                endTime: endTime || null,
                isAllDay: isAllDay || false,
                reason: reason || null,
                isRecurring: isRecurring || false,
                recurringDayOfWeek: recurringDayOfWeek || null,
            })
            .returning();

        return res.status(201).json(newBlock);
    } catch (err) {
        console.error("Error creating unavailability:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const listUnavailability = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { userId } = req.params;

        const blocks = await db
            .select()
            .from(userUnavailability)
            .where(eq(userUnavailability.userId, userId))
            .orderBy(userUnavailability.startDate);

        return res.status(200).json(blocks);
    } catch (err) {
        console.error("Error listing unavailability:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const listAllUnavailability = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Fetch all unavailability with user info joined
        const blocks = await db
            .select({
                id: userUnavailability.id,
                userId: userUnavailability.userId,
                startDate: userUnavailability.startDate,
                startTime: userUnavailability.startTime,
                endDate: userUnavailability.endDate,
                endTime: userUnavailability.endTime,
                isAllDay: userUnavailability.isAllDay,
                reason: userUnavailability.reason,
                isRecurring: userUnavailability.isRecurring,
                recurringDayOfWeek: userUnavailability.recurringDayOfWeek,
                createdAt: userUnavailability.createdAt,
                updatedAt: userUnavailability.updatedAt,
                userFirstName: users.firstName,
                userLastName: users.lastName,
                userEmail: users.email,
            })
            .from(userUnavailability)
            .leftJoin(users, eq(userUnavailability.userId, users.id))
            .orderBy(userUnavailability.startDate);

        return res.status(200).json(blocks);
    } catch (err) {
        console.error("Error listing all unavailability:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUnavailability = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { userId, unavailabilityId } = req.params;

        // Check if block exists and belongs to user
        const [existing] = await db
            .select()
            .from(userUnavailability)
            .where(
                and(eq(userUnavailability.id, unavailabilityId), eq(userUnavailability.userId, userId))
            );

        if (!existing) {
            return res.status(404).json({ error: "Unavailability block not found" });
        }

        const { startDate, endDate, startTime, endTime, isAllDay, reason, isRecurring, recurringDayOfWeek } =
            req.body;

        // Check for overlaps unless ignoreOverlap flag is set
        const ignoreOverlap = req.query.ignoreOverlap === "true";
        if (!ignoreOverlap) {
            const conflicts = await checkOverlaps(
                db,
                userId,
                {
                    startDate: startDate || existing.startDate,
                    endDate: endDate || existing.endDate,
                    startTime: startTime !== undefined ? startTime : existing.startTime,
                    endTime: endTime !== undefined ? endTime : existing.endTime,
                    isAllDay: isAllDay !== undefined ? isAllDay : existing.isAllDay,
                    isRecurring: isRecurring !== undefined ? isRecurring : existing.isRecurring,
                    recurringDayOfWeek:
                        recurringDayOfWeek !== undefined
                            ? recurringDayOfWeek
                            : existing.recurringDayOfWeek,
                },
                unavailabilityId
            );

            if (conflicts.length > 0) {
                return res.status(409).json({
                    error: "overlap_detected",
                    message: "This unavailability overlaps with existing blocks",
                    conflicts,
                });
            }
        }

        // Update the block
        const [updated] = await db
            .update(userUnavailability)
            .set({
                startDate: startDate || existing.startDate,
                endDate: endDate || existing.endDate,
                startTime: startTime !== undefined ? startTime : existing.startTime,
                endTime: endTime !== undefined ? endTime : existing.endTime,
                isAllDay: isAllDay !== undefined ? isAllDay : existing.isAllDay,
                reason: reason !== undefined ? reason : existing.reason,
                isRecurring: isRecurring !== undefined ? isRecurring : existing.isRecurring,
                recurringDayOfWeek:
                    recurringDayOfWeek !== undefined ? recurringDayOfWeek : existing.recurringDayOfWeek,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(userUnavailability.id, unavailabilityId))
            .returning();

        return res.status(200).json(updated);
    } catch (err) {
        console.error("Error updating unavailability:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteUnavailability = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { userId, unavailabilityId } = req.params;

        // Delete the block (will only delete if belongs to user)
        const result = await db
            .delete(userUnavailability)
            .where(
                and(eq(userUnavailability.id, unavailabilityId), eq(userUnavailability.userId, userId))
            );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Unavailability block not found" });
        }

        return res.status(204).send();
    } catch (err) {
        console.error("Error deleting unavailability:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
