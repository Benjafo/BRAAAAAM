import { and, eq, inArray, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { clients, customFormResponses, customForms, locations } from "../drizzle/org/schema.js";
import { findOrCreateLocation } from "../utils/locations.js";
import { applyQueryFilters } from "../utils/queryParams.js";

/*
 * Example Client Output
  {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "contactPreference": "string",
    "addresses": [
      {
        "addressLine1": "string",
        "city": "string",
        "state": "string",
        "zip": "string",
        "country": "string",
        "isPrimary": true,
        "vehiclePreferenceType": "string",
        "notes": "string",
        "gender": "Male"
      }
    ]
  }
 */

export const listClients = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        // Does org DB Connection exist?
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Pagination + Search + Sort
        const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(req, [
            clients.firstName,
            clients.lastName,
            clients.email,
            clients.phone,
        ]);

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(clients)
            .where(where);

        // Join clients with their associated location records
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
                allowMessages: clients.allowMessages,
                gender: clients.gender,
                birthYear: clients.birthYear,
                birthMonth: clients.birthMonth,
                livesAlone: clients.livesAlone,
                addressLocation: clients.addressLocation,
                emergencyContactName: clients.emergencyContactName,
                emergencyContactPhone: clients.emergencyContactPhone,
                emergencyContactRelationship: clients.emergencyContactRelationship,
                notes: clients.notes,
                pickupInstructions: clients.pickupInstructions,
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
            .leftJoin(locations, eq(clients.addressLocation, locations.id)) // One-to-One join via foreign key
            .where(where)
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);

        // Fetch custom field responses for all clients
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

        // Create a map of clientId -> customFields
        const customFieldsMap = new Map();
        for (const response of customFieldResponses) {
            customFieldsMap.set(response.entityId, response.responseData);
        }

        // Add customFields to each client
        const resultsWithCustomFields = data.map((client) => ({
            ...client,
            customFields: customFieldsMap.get(client.id) || {},
        }));

        return res.status(200).json({
            page,
            pageSize,
            total: Number(total),
            results: resultsWithCustomFields,
        });
    } catch (err) {
        console.error("Error listing clients:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const createClient = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const {
            firstName,
            lastName,
            email,
            phone,
            gender,
            contactPreference,
            address,
            birthMonth,
            birthYear,
            phoneIsCell,
            livesAlone,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelationship,
            notes,
            pickupInstructions,
            mobilityEquipment,
            mobilityEquipmentOther,
            vehicleTypes,
            hasOxygen,
            hasServiceAnimal,
            serviceAnimalDescription,
            otherLimitations,
            otherLimitationsOther,
        } = req.body;

        // Validate all required fields are provided
        if (!firstName || !lastName || !phone || !gender) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Create or reuse a location record if provided
        let addressId: string | null = null;
        if (address) {
            // Normalize fields to avoid case-sensitive mismatches
            const addr1 = address.addressLine1?.trim() ?? "";
            const addr2 = address.addressLine2?.trim() ?? null;
            const city = address.city?.trim() ?? "";
            const state = address.state?.trim() ?? "";
            const zip = address.zip?.trim() ?? "";
            const country = address.country?.trim() ?? "";

            // Look for existing location with same full address
            const [existingLocation] = await db
                .select({ id: locations.id })
                .from(locations)
                .where(
                    and(
                        eq(locations.addressLine1, addr1),
                        eq(locations.addressLine2, addr2),
                        eq(locations.city, city),
                        eq(locations.state, state),
                        eq(locations.zip, zip),
                        eq(locations.country, country)
                    )
                );

            if (existingLocation) {
                addressId = existingLocation.id;
            } else {
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

                addressId = newLocation.id;
            }
        }

        // Create client record and link to addressLocation if it exists
        const [newClient] = await db
            .insert(clients)
            .values({
                firstName,
                lastName,
                email,
                phone,
                phoneIsCell: phoneIsCell ?? false,
                gender,
                birthMonth,
                birthYear,
                contactPreference,
                livesAlone: livesAlone ?? false,
                addressLocation: addressId!,
                emergencyContactName,
                emergencyContactPhone,
                emergencyContactRelationship,
                notes,
                pickupInstructions,
                mobilityEquipment: mobilityEquipment ?? [],
                mobilityEquipmentOther,
                vehicleTypes: vehicleTypes ?? [],
                hasOxygen: hasOxygen ?? false,
                hasServiceAnimal: hasServiceAnimal ?? false,
                serviceAnimalDescription,
                otherLimitations: otherLimitations ?? [],
                otherLimitationsOther,
            })
            .returning(); // Return full client row

        // Save custom field responses if provided
        const customFields = req.body.customFields;
        if (customFields && Object.keys(customFields).length > 0) {
            const [clientForm] = await db
                .select()
                .from(customForms)
                .where(and(eq(customForms.targetEntity, "client"), eq(customForms.isActive, true)));

            if (clientForm) {
                await db.insert(customFormResponses).values({
                    formId: clientForm.id,
                    entityId: newClient.id,
                    entityType: "client",
                    responseData: customFields,
                    submittedBy: req.user?.id,
                });
            }
        }

        return res.status(201).json(newClient);
    } catch (err) {
        console.error("Error creating client:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getClient = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { clientId } = req.params;

        // Select client by ID & join with its location
        const [clientData] = await db
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
                allowMessages: clients.allowMessages,
                gender: clients.gender,
                birthYear: clients.birthYear,
                birthMonth: clients.birthMonth,
                livesAlone: clients.livesAlone,
                addressLocation: clients.addressLocation,
                emergencyContactName: clients.emergencyContactName,
                emergencyContactPhone: clients.emergencyContactPhone,
                emergencyContactRelationship: clients.emergencyContactRelationship,
                notes: clients.notes,
                pickupInstructions: clients.pickupInstructions,
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
            .where(eq(clients.id, clientId));

        // If no client found, return 404
        if (!clientData) {
            return res.status(404).json({ message: "Client not found" });
        }

        // Fetch custom field responses
        const [response] = await db
            .select()
            .from(customFormResponses)
            .where(
                and(eq(customFormResponses.entityId, clientId), eq(customFormResponses.entityType, "client"))
            );

        const clientWithCustomFields = {
            ...clientData,
            customFields: response?.responseData || {},
        };

        return res.status(200).json(clientWithCustomFields);
    } catch (err) {
        console.error("Error fetching client:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateClient = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { clientId } = req.params;
        const data = req.body;

        // Create or get location if address provided
        let addressId: string | null | undefined = undefined;
        if (data.address) {
            addressId = await findOrCreateLocation(db, data.address);
        }

        const [updatedClient] = await db
            .update(clients)
            .set({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                contactPreference: data.contactPreference,
                gender: data.gender,
                birthYear: data.birthYear,
                birthMonth: data.birthMonth,
                emergencyContactName: data.emergencyContactName,
                emergencyContactPhone: data.emergencyContactPhone,
                emergencyContactRelationship: data.emergencyContactRelationship,
                notes: data.notes,
                pickupInstructions: data.pickupInstructions,
                mobilityEquipment: data.mobilityEquipment,
                mobilityEquipmentOther: data.mobilityEquipmentOther,
                vehicleTypes: data.vehicleTypes,
                hasOxygen: data.hasOxygen,
                hasServiceAnimal: data.hasServiceAnimal,
                serviceAnimalDescription: data.serviceAnimalDescription,
                otherLimitations: data.otherLimitations,
                otherLimitationsOther: data.otherLimitationsOther,
                ...(addressId !== undefined && { addressLocation: addressId }),
                updatedAt: new Date().toISOString(), // Update timestamp manually
            })
            .where(eq(clients.id, clientId))
            .returning();

        // No client found
        if (!updatedClient) {
            return res.status(404).json({ message: "Client not found" });
        }

        // Update custom field responses if provided
        const customFields = req.body.customFields;
        if (customFields) {
            const [clientForm] = await db
                .select()
                .from(customForms)
                .where(and(eq(customForms.targetEntity, "client"), eq(customForms.isActive, true)));

            if (clientForm) {
                // Check if response already exists
                const [existingResponse] = await db
                    .select()
                    .from(customFormResponses)
                    .where(
                        and(
                            eq(customFormResponses.formId, clientForm.id),
                            eq(customFormResponses.entityId, clientId),
                            eq(customFormResponses.entityType, "client")
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
                        formId: clientForm.id,
                        entityId: clientId,
                        entityType: "client",
                        responseData: customFields,
                        submittedBy: req.user?.id,
                    });
                }
            }
        }

        return res.status(200).json(updatedClient);
    } catch (err) {
        console.error("Error updating client:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteClient = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { clientId } = req.params;

        // Delete client by ID
        const result = await db.delete(clients).where(eq(clients.id, clientId));

        // Ensure data was deleted
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Client not found" });
        }

        return res.status(204).send();
    } catch (err) {
        console.error("Error deleting client:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
