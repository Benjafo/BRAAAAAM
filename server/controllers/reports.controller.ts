import { and, between, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Request, Response } from "express";
import {
    appointments,
    clients,
    customFormResponses,
    locations,
    reportTemplates,
    roles,
    users,
    volunteerRecords,
} from "../drizzle/org/schema.js";

// interface Report {
//     id: string;
//     title: string;
//     query: string;
// }

// const reports: Report[] = [];

// export const listReports = (req: Request, res: Response): Response => {
//     return res.status(200).json(reports);
// };

// export const createReport = (req: Request, res: Response): Response => {
//     const data = req.body;

//     if (!data.title || !data.query) {
//         return res.status(400).json({ message: "Missing required fields" });
//     }

//     if (!data.id || reports.find((r) => r.id === data.id)) {
//         data.id = (reports.length + 1).toString();
//     }

//     const newReport: Report = {
//         id: data.id,
//         title: data.title,
//         query: data.query,
//     };

//     reports.push(newReport);
//     return res.status(201).json(newReport);
// };

// export const getReport = (req: Request, res: Response): Response => {
//     const { reportId } = req.params;
//     const report = reports.find((r) => r.id === reportId);

//     if (!report) {
//         return res.status(404).json({ message: "Report not found" });
//     }

//     return res.status(200).json(report);
// };

// export const updateReport = (req: Request, res: Response): Response => {
//     const { reportId } = req.params;
//     const data = req.body;

//     const index = reports.findIndex((r) => r.id === reportId);
//     if (index === -1) {
//         return res.status(404).json({ message: "Report not found" });
//     }

//     reports[index] = { ...reports[index], ...data };
//     return res.status(200).json(reports[index]);
// };

// export const deleteReport = (req: Request, res: Response): Response => {
//     const { reportId } = req.params;

//     const index = reports.findIndex((r) => r.id === reportId);
//     if (index === -1) {
//         return res.status(404).json({ message: "Report not found" });
//     }

//     reports.splice(index, 1);
//     return res.status(204).send();
// };

// export const generateReport = (req: Request, res: Response): Response => {
//     const { reportId } = req.params;
//     const report = reports.find((r) => r.id === reportId);

//     if (!report) {
//         return res.status(404).json({ message: "Report not found" });
//     }

//     return res.status(202).json({ message: `Report ${reportId} generated` });
// };

export const exportClients = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Parse query parameters
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize as string) || 100, 1000);
        const offset = (page - 1) * pageSize;

        // Build date filter for createdAt
        let dateFilter = undefined;
        if (startDate && endDate) {
            dateFilter = and(
                gte(clients.createdAt, new Date(startDate).toISOString()),
                lte(clients.createdAt, new Date(endDate).toISOString())
            );
        } else if (startDate) {
            dateFilter = gte(clients.createdAt, new Date(startDate).toISOString());
        } else if (endDate) {
            dateFilter = lte(clients.createdAt, new Date(endDate).toISOString());
        }

        // Get total count
        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(clients)
            .where(dateFilter);

        // Fetch client data with address join
        const data = await db
            .select({
                id: clients.id,
                firstName: clients.firstName,
                lastName: clients.lastName,
                email: clients.email,
                phone: clients.phone,
                phoneIsCell: clients.phoneIsCell,
                secondaryPhone: clients.secondaryPhone,
                secondaryPhoneIsCell: clients.secondaryPhoneIsCell,
                contactPreference: clients.contactPreference,
                okToTextPrimary: clients.okToTextPrimary,
                okToTextSecondary: clients.okToTextSecondary,
                gender: clients.gender,
                birthYear: clients.birthYear,
                birthMonth: clients.birthMonth,
                livesAlone: clients.livesAlone,
                emergencyContactName: clients.emergencyContactName,
                emergencyContactPhone: clients.emergencyContactPhone,
                emergencyContactRelationship: clients.emergencyContactRelationship,
                notes: clients.notes,
                pickupInstructions: clients.pickupInstructions,
                mobilityEquipment: clients.mobilityEquipment,
                mobilityEquipmentOther: clients.mobilityEquipmentOther,
                vehicleTypes: clients.vehicleTypes,
                hasOxygen: clients.hasOxygen,
                hasServiceAnimal: clients.hasServiceAnimal,
                serviceAnimalDescription: clients.serviceAnimalDescription,
                otherLimitations: clients.otherLimitations,
                otherLimitationsOther: clients.otherLimitationsOther,
                isActive: clients.isActive,
                createdAt: clients.createdAt,
                updatedAt: clients.updatedAt,
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
            .from(clients)
            .leftJoin(locations, eq(clients.addressLocation, locations.id))
            .where(dateFilter)
            .orderBy(clients.createdAt)
            .limit(pageSize)
            .offset(offset);

        // Fetch custom field responses
        const clientIds = data.map((client) => client.id);
        const customFieldResponses =
            clientIds.length > 0
                ? await db
                      .select()
                      .from(customFormResponses)
                      .where(
                          and(
                              eq(customFormResponses.entityType, "client"),
                              inArray(customFormResponses.entityId, clientIds)
                          )
                      )
                : [];

        // Create map of clientId -> customFields
        const customFieldsMap = new Map();
        for (const response of customFieldResponses) {
            customFieldsMap.set(response.entityId, response.responseData);
        }

        // Add customFields to results
        const resultsWithCustomFields = data.map((client) => ({
            ...client,
            customFields: customFieldsMap.get(client.id) || {},
        }));

        return res.status(200).json({
            results: resultsWithCustomFields,
            pagination: {
                page,
                pageSize,
                totalRecords: Number(total),
                totalPages: Math.ceil(Number(total) / pageSize),
            },
        });
    } catch (err) {
        console.error("Error exporting clients:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const exportUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Parse query parameters
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize as string) || 100, 1000);
        const offset = (page - 1) * pageSize;

        // Build date filter for createdAt
        let dateFilter = undefined;
        if (startDate && endDate) {
            dateFilter = and(
                gte(users.createdAt, new Date(startDate).toISOString()),
                lte(users.createdAt, new Date(endDate).toISOString())
            );
        } else if (startDate) {
            dateFilter = gte(users.createdAt, new Date(startDate).toISOString());
        } else if (endDate) {
            dateFilter = lte(users.createdAt, new Date(endDate).toISOString());
        }

        // Get total count
        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(users)
            .where(dateFilter);

        // Fetch user data with joins
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
                vehicleTypes: users.vehicleTypes,
                vehicleColor: users.vehicleColor,
                maxRidesPerWeek: users.maxRidesPerWeek,
                townPreferences: users.townPreferences,
                destinationLimitations: users.destinationLimitations,
                lifespanReimbursement: users.lifespanReimbursement,
                canAccommodateMobilityEquipment: users.canAccommodateMobilityEquipment,
                canAccommodateOxygen: users.canAccommodateOxygen,
                canAccommodateServiceAnimal: users.canAccommodateServiceAnimal,
                canAccommodateAdditionalRider: users.canAccommodateAdditionalRider,
                isActive: users.isActive,
                isDriver: users.isDriver,
                roleId: users.roleId,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                role: {
                    id: roles.id,
                    name: roles.name,
                },
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
            .where(dateFilter)
            .orderBy(users.createdAt)
            .limit(pageSize)
            .offset(offset);

        // Fetch custom field responses
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

        // Create map of userId -> customFields
        const customFieldsMap = new Map();
        for (const response of customFieldResponses) {
            customFieldsMap.set(response.entityId, response.responseData);
        }

        // Add customFields to results
        const resultsWithCustomFields = data.map((user) => ({
            ...user,
            customFields: customFieldsMap.get(user.id) || {},
        }));

        return res.status(200).json({
            results: resultsWithCustomFields,
            pagination: {
                page,
                pageSize,
                totalRecords: Number(total),
                totalPages: Math.ceil(Number(total) / pageSize),
            },
        });
    } catch (err) {
        console.error("Error exporting users:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const exportAppointments = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(400).json({ message: "Organization context missing" });

        // Parse query parameters
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize as string) || 100, 1000);
        const offset = (page - 1) * pageSize;

        // Build date filter for startDate
        let dateFilter = undefined;
        if (startDate && endDate) {
            dateFilter = and(
                gte(appointments.startDate, startDate),
                lte(appointments.startDate, endDate)
            );
        } else if (startDate) {
            dateFilter = gte(appointments.startDate, startDate);
        } else if (endDate) {
            dateFilter = lte(appointments.startDate, endDate);
        }

        // Create aliases for joins
        const pickupLocations = alias(locations, "pickup_locations");
        const destinationLocations = alias(locations, "destination_locations");
        const driverUsers = alias(users, "driver_users");

        // Get total count
        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(appointments)
            .where(dateFilter);

        // Fetch appointment data with all joins
        const data = await db
            .select({
                id: appointments.id,
                startDate: appointments.startDate,
                startTime: appointments.startTime,
                estimatedDurationMinutes: appointments.estimatedDurationMinutes,
                status: appointments.status,
                tripType: appointments.tripType,
                tripPurpose: appointments.tripPurpose,
                donationType: appointments.donationType,
                donationAmount: appointments.donationAmount,
                milesDriven: appointments.milesDriven,
                notes: appointments.notes,
                createdAt: appointments.createdAt,
                updatedAt: appointments.updatedAt,
                hasAdditionalRider: appointments.hasAdditionalRider,
                additionalRiderFirstName: appointments.additionalRiderFirstName,
                additionalRiderLastName: appointments.additionalRiderLastName,
                relationshipToClient: appointments.relationshipToClient,
                // Client info
                client: {
                    id: clients.id,
                    firstName: clients.firstName,
                    lastName: clients.lastName,
                    phone: clients.phone,
                },
                // Driver info
                driver: {
                    id: driverUsers.id,
                    firstName: driverUsers.firstName,
                    lastName: driverUsers.lastName,
                    phone: driverUsers.phone,
                },
                // Dispatcher info
                dispatcher: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                },
                // Pickup location
                pickupLocation: {
                    id: pickupLocations.id,
                    addressLine1: pickupLocations.addressLine1,
                    addressLine2: pickupLocations.addressLine2,
                    city: pickupLocations.city,
                    state: pickupLocations.state,
                    zip: pickupLocations.zip,
                },
                // Destination location
                destinationLocation: {
                    id: destinationLocations.id,
                    addressLine1: destinationLocations.addressLine1,
                    addressLine2: destinationLocations.addressLine2,
                    city: destinationLocations.city,
                    state: destinationLocations.state,
                    zip: destinationLocations.zip,
                },
            })
            .from(appointments)
            .leftJoin(clients, eq(appointments.clientId, clients.id))
            .leftJoin(users, eq(appointments.dispatcherId, users.id))
            .leftJoin(driverUsers, eq(appointments.driverId, driverUsers.id))
            .leftJoin(pickupLocations, eq(appointments.pickupLocation, pickupLocations.id))
            .leftJoin(
                destinationLocations,
                eq(appointments.destinationLocation, destinationLocations.id)
            )
            .where(dateFilter)
            .orderBy(appointments.startDate)
            .limit(pageSize)
            .offset(offset);

        // Fetch custom field responses
        const appointmentIds = data.map((appointment) => appointment.id);
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

        // Create map of appointmentId -> customFields
        const customFieldsMap = new Map();
        for (const response of customFieldResponses) {
            customFieldsMap.set(response.entityId, response.responseData);
        }

        // Add customFields to results
        const resultsWithCustomFields = data.map((appointment) => ({
            ...appointment,
            customFields: customFieldsMap.get(appointment.id) || {},
        }));

        return res.status(200).json({
            results: resultsWithCustomFields,
            pagination: {
                page,
                pageSize,
                totalRecords: Number(total),
                totalPages: Math.ceil(Number(total) / pageSize),
            },
        });
    } catch (err) {
        console.error("Error exporting appointments:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const exportVolunteerRecords = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(400).json({ message: "Organization context missing" });

        // Parse query parameters
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        const userId = req.query.userId as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize as string) || 100, 1000);
        const offset = (page - 1) * pageSize;

        // Build date filter
        let dateFilter = undefined;
        if (startDate && endDate) {
            dateFilter = and(
                gte(volunteerRecords.date, startDate),
                lte(volunteerRecords.date, endDate)
            );
        } else if (startDate) {
            dateFilter = gte(volunteerRecords.date, startDate);
        } else if (endDate) {
            dateFilter = lte(volunteerRecords.date, endDate);
        }

        // Build user filter
        let userFilter = undefined;
        if (userId) {
            userFilter = eq(volunteerRecords.userId, userId);
        }

        // Combine filters
        const filters = [dateFilter, userFilter].filter(Boolean);
        const finalFilter = filters.length > 0 ? and(...filters) : undefined;

        // Get total count
        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(volunteerRecords)
            .where(finalFilter);

        // Fetch volunteer records data with user join
        const data = await db
            .select({
                id: volunteerRecords.id,
                date: volunteerRecords.date,
                hours: volunteerRecords.hours,
                miles: volunteerRecords.miles,
                description: volunteerRecords.description,
                createdAt: volunteerRecords.createdAt,
                updatedAt: volunteerRecords.updatedAt,
                volunteer: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                },
            })
            .from(volunteerRecords)
            .leftJoin(users, eq(volunteerRecords.userId, users.id))
            .where(finalFilter)
            .orderBy(volunteerRecords.date)
            .limit(pageSize)
            .offset(offset);

        return res.status(200).json({
            results: data,
            pagination: {
                page,
                pageSize,
                totalRecords: Number(total),
                totalPages: Math.ceil(Number(total) / pageSize),
            },
        });
    } catch (err) {
        console.error("Error exporting volunteer records:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const listReportTemplates = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const entityType = req.query.entityType as string | undefined;

        // Build filter: user's own templates OR shared templates
        let whereClause = or(
            eq(reportTemplates.createdByUserId, userId),
            eq(reportTemplates.isShared, true)
        );

        // Optionally filter by entity type
        if (entityType) {
            whereClause = and(whereClause, eq(reportTemplates.entityType, entityType));
        }

        const templates = await db
            .select({
                id: reportTemplates.id,
                name: reportTemplates.name,
                description: reportTemplates.description,
                entityType: reportTemplates.entityType,
                selectedColumns: reportTemplates.selectedColumns,
                isShared: reportTemplates.isShared,
                createdBy: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                },
                createdAt: reportTemplates.createdAt,
                updatedAt: reportTemplates.updatedAt,
            })
            .from(reportTemplates)
            .leftJoin(users, eq(reportTemplates.createdByUserId, users.id))
            .where(whereClause)
            .orderBy(reportTemplates.name);

        return res.status(200).json({ templates });
    } catch (err) {
        console.error("Error listing report templates:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const createReportTemplate = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { name, description, entityType, selectedColumns, isShared } = req.body;

        // Validate required fields
        if (!name || !entityType || !selectedColumns || !Array.isArray(selectedColumns)) {
            return res.status(400).json({ message: "Missing or invalid required fields" });
        }

        // Validate entity type
        if (!["clients", "users", "appointments", "volunteerRecords"].includes(entityType)) {
            return res.status(400).json({ message: "Invalid entity type" });
        }

        // Create template
        const [newTemplate] = await db
            .insert(reportTemplates)
            .values({
                name,
                description: description || null,
                entityType,
                selectedColumns,
                createdByUserId: userId,
                isShared: isShared || false,
            })
            .returning();

        return res.status(201).json({ template: newTemplate });
    } catch (err: any) {
        console.error("Error creating report template:", err);

        // Handle duplicate name error
        if (err.code === "23505") {
            return res.status(409).json({ message: "A template with this name already exists" });
        }

        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getReportTemplate = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { templateId } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const [template] = await db
            .select()
            .from(reportTemplates)
            .where(
                and(
                    eq(reportTemplates.id, templateId),
                    or(
                        eq(reportTemplates.createdByUserId, userId),
                        eq(reportTemplates.isShared, true)
                    )
                )
            );

        if (!template) {
            return res.status(404).json({ message: "Template not found" });
        }

        return res.status(200).json({ template });
    } catch (err) {
        console.error("Error getting report template:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateReportTemplate = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { templateId } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { name, description, entityType, selectedColumns, isShared } = req.body;

        // Verify ownership
        const [existing] = await db
            .select()
            .from(reportTemplates)
            .where(
                and(eq(reportTemplates.id, templateId), eq(reportTemplates.createdByUserId, userId))
            );

        if (!existing) {
            return res
                .status(404)
                .json({ message: "Template not found or you don't have permission to edit it" });
        }

        // Update template
        const [updated] = await db
            .update(reportTemplates)
            .set({
                name: name || existing.name,
                description: description !== undefined ? description : existing.description,
                entityType: entityType || existing.entityType,
                selectedColumns: selectedColumns || existing.selectedColumns,
                isShared: isShared !== undefined ? isShared : existing.isShared,
            })
            .where(eq(reportTemplates.id, templateId))
            .returning();

        return res.status(200).json({ template: updated });
    } catch (err) {
        console.error("Error updating report template:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteReportTemplate = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { templateId } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Verify ownership
        const [existing] = await db
            .select()
            .from(reportTemplates)
            .where(
                and(eq(reportTemplates.id, templateId), eq(reportTemplates.createdByUserId, userId))
            );

        if (!existing) {
            return res.status(404).json({
                message: "Template not found or you don't have permission to delete it",
            });
        }

        await db.delete(reportTemplates).where(eq(reportTemplates.id, templateId));

        return res.status(204).send();
    } catch (err) {
        console.error("Error deleting report template:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
