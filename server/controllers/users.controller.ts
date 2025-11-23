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

        // Define columns for searching, sorting, and filtering
        const searchableColumns = [
            users.firstName,
            users.lastName,
            users.email,
            users.phone,
            locations.addressLine1,
            locations.city,
            locations.zip,
            roles.name,
        ];

        const sortableColumns: Record<string, any> = {
            name: users.firstName,
            firstName: users.firstName,
            lastName: users.lastName,
            phone: users.phone,
            email: users.email,
            address: locations.addressLine1,
            city: locations.city,
            zip: locations.zip,
            role: roles.name,
        };

        const filterableColumns: Record<string, any> = {
            ...sortableColumns,
            name: [users.firstName, users.lastName], // Filter by both firstName and lastName
            isDriverRole: roles.isDriverRole, // Filter by driver role
        };

        const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(
            req,
            searchableColumns,
            sortableColumns,
            filterableColumns
        );

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(users)
            .leftJoin(locations, eq(users.addressLocation, locations.id))
            .leftJoin(roles, eq(users.roleId, roles.id))
            .where(where);

        const data = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                phone: users.phone,
                phoneIsCell: users.phoneIsCell,
                okToTextPrimary: users.okToTextPrimary,
                secondaryPhone: users.secondaryPhone,
                secondaryPhoneIsCell: users.secondaryPhoneIsCell,
                okToTextSecondary: users.okToTextSecondary,
                contactPreference: users.contactPreference,
                birthYear: users.birthYear,
                birthMonth: users.birthMonth,
                emergencyContactName: users.emergencyContactName,
                emergencyContactPhone: users.emergencyContactPhone,
                emergencyContactRelationship: users.emergencyContactRelationship,
                isActive: users.isActive,
                temporaryInactiveUntil: users.temporaryInactiveUntil,
                inactiveSince: users.inactiveSince,
                awayFrom: users.awayFrom,
                awayTo: users.awayTo,
                isDriver: users.isDriver,
                canAccommodateMobilityEquipment: users.canAccommodateMobilityEquipment,
                vehicleTypes: users.vehicleTypes,
                vehicleColor: users.vehicleColor,
                townPreferences: users.townPreferences,
                destinationLimitations: users.destinationLimitations,
                canAccommodateOxygen: users.canAccommodateOxygen,
                canAccommodateServiceAnimal: users.canAccommodateServiceAnimal,
                canAccommodateAdditionalRider: users.canAccommodateAdditionalRider,
                maxRidesPerWeek: users.maxRidesPerWeek,
                lifespanReimbursement: users.lifespanReimbursement,
                roleId: users.roleId,
                roleName: roles.name,
                isDriverRole: roles.isDriverRole,
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
            phoneIsCell,
            okToTextPrimary,
            secondaryPhone,
            secondaryPhoneIsCell,
            okToTextSecondary,
            contactPreference,
            birthYear,
            birthMonth,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelationship,
            _notes,
            isActive,
            temporaryInactiveUntil,
            inactiveSince,
            awayFrom,
            awayTo,
            isDriver,
            roleId,
            address,
            canAccommodateMobilityEquipment,
            vehicleTypes,
            vehicleColor,
            townPreferences,
            destinationLimitations,
            canAccommodateOxygen,
            canAccommodateServiceAnimal,
            canAccommodateAdditionalRider,
            maxRides,
            lifespanReimbursement,
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
                phoneIsCell: phoneIsCell ?? false,
                okToTextPrimary: okToTextPrimary ?? false,
                secondaryPhone: secondaryPhone ?? undefined,
                secondaryPhoneIsCell: secondaryPhoneIsCell ?? false,
                okToTextSecondary: okToTextSecondary ?? false,
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
                temporaryInactiveUntil: temporaryInactiveUntil ?? undefined,
                inactiveSince: inactiveSince ?? undefined,
                awayFrom: awayFrom ?? undefined,
                awayTo: awayTo ?? undefined,
                isDriver: isDriver ?? false,
                canAccommodateMobilityEquipment: canAccommodateMobilityEquipment ?? [],
                vehicleTypes: vehicleTypes ?? undefined,
                vehicleColor: vehicleColor ?? undefined,
                townPreferences: townPreferences ?? undefined,
                destinationLimitations: destinationLimitations ?? undefined,
                canAccommodateOxygen: canAccommodateOxygen ?? false,
                canAccommodateServiceAnimal: canAccommodateServiceAnimal ?? false,
                canAccommodateAdditionalRider: canAccommodateAdditionalRider ?? false,
                maxRidesPerWeek: maxRides ?? 0,
                lifespanReimbursement: lifespanReimbursement ?? false,
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

        req.auditLog({
            actionType: "user.created",
            objectId: newUser.id,
            objectType: "user",
            actionMessage: `User '${firstName} ${lastName}' created by ${req.user?.firstName} ${req.user?.lastName}`,
        });

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
                phoneIsCell: users.phoneIsCell,
                okToTextPrimary: users.okToTextPrimary,
                secondaryPhone: users.secondaryPhone,
                secondaryPhoneIsCell: users.secondaryPhoneIsCell,
                okToTextSecondary: users.okToTextSecondary,
                contactPreference: users.contactPreference,
                birthYear: users.birthYear,
                birthMonth: users.birthMonth,
                emergencyContactName: users.emergencyContactName,
                emergencyContactPhone: users.emergencyContactPhone,
                emergencyContactRelationship: users.emergencyContactRelationship,
                isActive: users.isActive,
                temporaryInactiveUntil: users.temporaryInactiveUntil,
                inactiveSince: users.inactiveSince,
                awayFrom: users.awayFrom,
                awayTo: users.awayTo,
                isDriver: users.isDriver,
                canAccommodateMobilityEquipment: users.canAccommodateMobilityEquipment,
                vehicleTypes: users.vehicleTypes,
                vehicleColor: users.vehicleColor,
                townPreferences: users.townPreferences,
                destinationLimitations: users.destinationLimitations,
                canAccommodateOxygen: users.canAccommodateOxygen,
                canAccommodateServiceAnimal: users.canAccommodateServiceAnimal,
                canAccommodateAdditionalRider: users.canAccommodateAdditionalRider,
                maxRidesPerWeek: users.maxRidesPerWeek,
                lifespanReimbursement: users.lifespanReimbursement,
                roleId: users.roleId,
                roleName: roles.name,
                isDriverRole: roles.isDriverRole,
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

        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId));

        const [updatedUser] = await db
            .update(users)
            .set({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                phoneIsCell: data.phoneIsCell,
                okToTextPrimary: data.okToTextPrimary,
                secondaryPhone: data.secondaryPhone,
                secondaryPhoneIsCell: data.secondaryPhoneIsCell,
                okToTextSecondary: data.okToTextSecondary,
                contactPreference: data.contactPreference,
                birthYear: data.birthYear,
                birthMonth: data.birthMonth,
                emergencyContactName: data.emergencyContactName,
                emergencyContactPhone: data.emergencyContactPhone,
                emergencyContactRelationship: data.emergencyContactRelationship,
                isActive: data.isActive,
                temporaryInactiveUntil: data.temporaryInactiveUntil,
                inactiveSince: data.inactiveSince,
                awayFrom: data.awayFrom,
                awayTo: data.awayTo,
                isDriver: data.isDriver,
                canAccommodateMobilityEquipment: data.canAccommodateMobilityEquipment,
                vehicleTypes: data.vehicleTypes,
                vehicleColor: data.vehicleColor,
                townPreferences: data.townPreferences,
                destinationLimitations: data.destinationLimitations,
                canAccommodateOxygen: data.canAccommodateOxygen,
                canAccommodateServiceAnimal: data.canAccommodateServiceAnimal,
                canAccommodateAdditionalRider: data.canAccommodateAdditionalRider,
                maxRidesPerWeek: data.maxRides,
                lifespanReimbursement: data.lifespanReimbursement,
                ...(data.roleId !== undefined && { roleId: data.roleId }),
                ...(addressId !== undefined && { addressLocation: addressId }),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(users.id, userId))
            .returning();

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        let existingCustomFormFieldsRecord;
        let customFormFieldsRecord;

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
                    const usersCustomFormFields = await db
                        .update(customFormResponses)
                        .set({
                            responseData: customFields,
                            submittedBy: req.user?.id,
                            updatedAt: new Date().toISOString(),
                        })
                        .where(eq(customFormResponses.id, existingResponse.id));

                    customFormFieldsRecord = usersCustomFormFields;
                    existingCustomFormFieldsRecord = existingResponse;
                } else {
                    // Create new response
                    const usersCustomFormFields = await db.insert(customFormResponses).values({
                        formId: userForm.id,
                        entityId: userId,
                        entityType: "user",
                        responseData: customFields,
                        submittedBy: req.user?.id,
                    });

                    customFormFieldsRecord = usersCustomFormFields;
                }
            }
        }

        req.auditLog({
            actionType: "user.updated",
            objectId: updatedUser.id,
            objectType: "user",
            actionMessage: `User '${updatedUser.firstName} ${updatedUser.lastName}' updated by ${req.user?.firstName} ${req.user?.lastName}`,
            actionDetails: { 
                original: {
                    user: existingUser,
                    customFormFields: existingCustomFormFieldsRecord || null,
                },
                updated: {
                    user: updatedUser,
                    customFormFields: customFormFieldsRecord || null,
                },
             },
        });


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

        const [deletedUser] = await db.delete(users).where(eq(users.id, userId)).returning();

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        req.auditLog({
            actionType: "user.deleted",
            objectId: userId,
            objectType: "user",
            actionMessage: `User '${deletedUser.firstName} ${deletedUser.lastName}' deleted by ${req.user?.firstName} ${req.user?.lastName}`,
            actionDetails: {
                user: deletedUser,
            }
        });

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

/**
 * Helper function to detect identical (duplicate) unavailability blocks
 * Checks for exact duplicates including cross-type duplicates (temporary vs recurring)
 */
async function checkDuplicate(
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
): Promise<UnavailabilityBlock | null> {
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

    for (const existing of existingBlocks) {
        let isDuplicate = false;

        if (!newBlock.isRecurring && !existing.isRecurring) {
            // Case 1: Both Temporary - check exact match
            isDuplicate =
                newBlock.startDate === existing.startDate &&
                newBlock.endDate === existing.endDate &&
                newBlock.startTime === existing.startTime &&
                newBlock.endTime === existing.endTime &&
                newBlock.isAllDay === existing.isAllDay;
        } else if (newBlock.isRecurring && existing.isRecurring) {
            // Case 2: Both Recurring - check day of week and times
            isDuplicate =
                newBlock.recurringDayOfWeek === existing.recurringDayOfWeek &&
                newBlock.startTime === existing.startTime &&
                newBlock.endTime === existing.endTime &&
                newBlock.isAllDay === existing.isAllDay;
        } else {
            // Case 3: One Temporary, One Recurring
            // Only check if temporary is single-day
            const tempBlock = newBlock.isRecurring ? existing : newBlock;
            const recurBlock = newBlock.isRecurring ? newBlock : existing;

            // Check if temporary is single-day
            const isSingleDay = tempBlock.startDate === tempBlock.endDate;

            if (isSingleDay) {
                // Get day of week for the temporary date
                const tempDate = new Date(tempBlock.startDate);
                const daysOfWeek = [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                ];
                const tempDayOfWeek = daysOfWeek[tempDate.getDay()];

                // Check if day matches and times are identical
                isDuplicate =
                    tempDayOfWeek === recurBlock.recurringDayOfWeek &&
                    tempBlock.startTime === recurBlock.startTime &&
                    tempBlock.endTime === recurBlock.endTime &&
                    tempBlock.isAllDay === recurBlock.isAllDay;
            }
        }

        if (isDuplicate) {
            return existing;
        }
    }

    return null;
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

        // Check for duplicates first
        const duplicate = await checkDuplicate(db, userId, {
            startDate,
            endDate,
            startTime: startTime || null,
            endTime: endTime || null,
            isAllDay: isAllDay || false,
            isRecurring: isRecurring || false,
            recurringDayOfWeek: recurringDayOfWeek || null,
        });

        if (duplicate) {
            return res.status(409).json({
                error: "duplicate_detected",
                message: "This unavailability already exists",
                duplicate,
            });
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

        // Define columns for searching, sorting, and filtering
        const recurringText = sql<string>`CASE WHEN ${userUnavailability.isRecurring} = true THEN 'Yes' ELSE 'No' END`;
        const dayOfWeekText = sql<string>`${userUnavailability.recurringDayOfWeek}::text`;
        const multiDayText = sql<string>`CASE WHEN ${userUnavailability.startDate} != ${userUnavailability.endDate} THEN 'Yes' ELSE 'No' END`;

        const searchableColumns = [
            userUnavailability.reason,
            dayOfWeekText, // Cast enum to text for search
            recurringText,
            multiDayText,
        ];

        const sortableColumns: Record<string, any> = {
            date: userUnavailability.startDate,
            time: userUnavailability.startTime,
            dayOfWeek: userUnavailability.recurringDayOfWeek,
            recurring: userUnavailability.isRecurring,
            multiDay: userUnavailability.startDate,
            reason: userUnavailability.reason,
        };

        const filterableColumns: Record<string, any> = {
            reason: userUnavailability.reason,
            date: userUnavailability.startDate,
            time: userUnavailability.startTime,
            dayOfWeek: dayOfWeekText, // Cast enum to text for filter
            recurring: (value: string) => {
                const lowerValue = value.toLowerCase();
                if (lowerValue.includes("yes") && !lowerValue.includes("no")) {
                    return eq(userUnavailability.isRecurring, true);
                } else if (lowerValue.includes("no") && !lowerValue.includes("yes")) {
                    return eq(userUnavailability.isRecurring, false);
                }
                return sql`FALSE`;
            },
            multiDay: (value: string) => {
                const lowerValue = value.toLowerCase();
                if (lowerValue.includes("yes") && !lowerValue.includes("no")) {
                    return sql`${userUnavailability.startDate} != ${userUnavailability.endDate}`;
                } else if (lowerValue.includes("no") && !lowerValue.includes("yes")) {
                    return sql`${userUnavailability.startDate} = ${userUnavailability.endDate}`;
                }
                return sql`FALSE`;
            },
        };

        const { where: filterWhere, orderBy, limit, offset, page, pageSize } = applyQueryFilters(
            req,
            searchableColumns,
            sortableColumns,
            filterableColumns
        );

        // Combine userId filter with other filters
        const where = and(eq(userUnavailability.userId, userId), filterWhere);

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(userUnavailability)
            .where(where);

        const blocks = await db
            .select()
            .from(userUnavailability)
            .where(where)
            .orderBy(...(orderBy.length > 0 ? orderBy : [userUnavailability.startDate]))
            .limit(limit)
            .offset(offset);

        return res.status(200).json({
            page,
            pageSize,
            total: Number(total),
            results: blocks,
        });
    } catch (err) {
        console.error("Error listing unavailability:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const listAllUnavailability = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Define columns for searching, sorting, and filtering
        const recurringText = sql<string>`CASE WHEN ${userUnavailability.isRecurring} = true THEN 'Yes' ELSE 'No' END`;
        const dayOfWeekText = sql<string>`${userUnavailability.recurringDayOfWeek}::text`;
        const multiDayText = sql<string>`CASE WHEN ${userUnavailability.startDate} != ${userUnavailability.endDate} THEN 'Yes' ELSE 'No' END`;

        const searchableColumns = [
            users.firstName,
            users.lastName,
            users.email,
            userUnavailability.reason,
            dayOfWeekText, // Cast enum to text for search
            recurringText,
            multiDayText,
        ];

        const sortableColumns: Record<string, any> = {
            user: users.firstName,
            date: userUnavailability.startDate,
            time: userUnavailability.startTime,
            dayOfWeek: userUnavailability.recurringDayOfWeek,
            recurring: userUnavailability.isRecurring,
            multiDay: userUnavailability.startDate, // Can't directly sort by computed multi-day
            reason: userUnavailability.reason,
        };

        const filterableColumns: Record<string, any> = {
            user: [users.firstName, users.lastName, users.email],
            reason: userUnavailability.reason,
            date: userUnavailability.startDate,
            time: userUnavailability.startTime,
            dayOfWeek: dayOfWeekText, // Cast enum to text for filter
            recurring: (value: string) => {
                const lowerValue = value.toLowerCase();
                if (lowerValue.includes("yes") && !lowerValue.includes("no")) {
                    return eq(userUnavailability.isRecurring, true);
                } else if (lowerValue.includes("no") && !lowerValue.includes("yes")) {
                    return eq(userUnavailability.isRecurring, false);
                }
                return sql`FALSE`;
            },
            multiDay: (value: string) => {
                const lowerValue = value.toLowerCase();
                if (lowerValue.includes("yes") && !lowerValue.includes("no")) {
                    return sql`${userUnavailability.startDate} != ${userUnavailability.endDate}`;
                } else if (lowerValue.includes("no") && !lowerValue.includes("yes")) {
                    return sql`${userUnavailability.startDate} = ${userUnavailability.endDate}`;
                }
                return sql`FALSE`;
            },
        };

        const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(
            req,
            searchableColumns,
            sortableColumns,
            filterableColumns
        );

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(userUnavailability)
            .leftJoin(users, eq(userUnavailability.userId, users.id))
            .where(where);

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
            .where(where)
            .orderBy(...(orderBy.length > 0 ? orderBy : [userUnavailability.startDate]))
            .limit(limit)
            .offset(offset);

        return res.status(200).json({
            page,
            pageSize,
            total: Number(total),
            results: blocks,
        });
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

        // Check for duplicates first
        const duplicate = await checkDuplicate(
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
                    recurringDayOfWeek !== undefined ? recurringDayOfWeek : existing.recurringDayOfWeek,
            },
            unavailabilityId
        );

        if (duplicate) {
            return res.status(409).json({
                error: "duplicate_detected",
                message: "This unavailability already exists",
                duplicate,
            });
        }

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
