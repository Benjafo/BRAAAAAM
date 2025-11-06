import { Request, Response } from "express";
import { customForms, customFormFields, customFormResponses } from "../drizzle/org/schema.js";
import { eq, and } from "drizzle-orm";

export const listCustomForms = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { targetEntity } = req.query; // Optional filter

        let whereClause = eq(customForms.isActive, true);
        if (targetEntity) {
            whereClause = and(whereClause, eq(customForms.targetEntity, targetEntity as string)) as any;
        }

        const forms = await db
            .select()
            .from(customForms)
            .where(whereClause)
            .orderBy(customForms.displayOrder, customForms.name);

        // Get fields for each form
        const formsWithFields = await Promise.all(
            forms.map(async (form) => {
                const fields = await db
                    .select()
                    .from(customFormFields)
                    .where(eq(customFormFields.formId, form.id))
                    .orderBy(customFormFields.displayOrder);

                return { ...form, fields };
            })
        );

        return res.status(200).json(formsWithFields);
    } catch (err) {
        console.error("Error listing custom forms:", err);
        return res.status(500).json({ error: "Failed to list custom forms" });
    }
};

export const getCustomForm = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { formId } = req.params;

        const [form] = await db.select().from(customForms).where(eq(customForms.id, formId));

        if (!form) {
            return res.status(404).json({ error: "Form not found" });
        }

        const fields = await db
            .select()
            .from(customFormFields)
            .where(eq(customFormFields.formId, formId))
            .orderBy(customFormFields.displayOrder);

        return res.status(200).json({ ...form, fields });
    } catch (err) {
        console.error("Error getting custom form:", err);
        return res.status(500).json({ error: "Failed to get custom form" });
    }
};

export const createCustomForm = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { name, description, targetEntity, fields } = req.body;

        if (!name || !targetEntity) {
            return res.status(400).json({ error: "Name and target entity are required" });
        }

        if (!["client", "user", "appointment"].includes(targetEntity)) {
            return res.status(400).json({ error: "Invalid target entity" });
        }

        // Check if form already exists for this entity
        const [existingForm] = await db
            .select()
            .from(customForms)
            .where(eq(customForms.targetEntity, targetEntity));

        if (existingForm) {
            return res.status(400).json({
                error: `A custom form already exists for ${targetEntity}. Please edit the existing form instead.`,
            });
        }

        // Create form
        const [newForm] = await db
            .insert(customForms)
            .values({
                name,
                description,
                targetEntity,
                isActive: true,
            })
            .returning();

        // Create fields if provided
        if (fields && Array.isArray(fields) && fields.length > 0) {
            const fieldValues = fields.map((field: any, index: number) => ({
                formId: newForm.id,
                fieldKey: field.fieldKey,
                label: field.label,
                fieldType: field.fieldType,
                placeholder: field.placeholder,
                helpText: field.helpText,
                defaultValue: field.defaultValue,
                isRequired: field.isRequired || false,
                options: field.options,
                validationRules: field.validationRules,
                conditionalLogic: field.conditionalLogic,
                displayOrder: field.displayOrder ?? index,
            }));

            await db.insert(customFormFields).values(fieldValues);
        }

        // Return form with fields
        const createdFields = await db
            .select()
            .from(customFormFields)
            .where(eq(customFormFields.formId, newForm.id))
            .orderBy(customFormFields.displayOrder);

        return res.status(201).json({ ...newForm, fields: createdFields });
    } catch (err) {
        console.error("Error creating custom form:", err);
        return res.status(500).json({ error: "Failed to create custom form" });
    }
};

export const updateCustomForm = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { formId } = req.params;
        const { name, description, isActive, fields } = req.body;

        // Update form metadata
        const [updatedForm] = await db
            .update(customForms)
            .set({
                name,
                description,
                isActive,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(customForms.id, formId))
            .returning();

        if (!updatedForm) {
            return res.status(404).json({ error: "Form not found" });
        }

        // Update fields if provided
        if (fields && Array.isArray(fields)) {
            // Delete existing fields
            await db.delete(customFormFields).where(eq(customFormFields.formId, formId));

            // Insert updated fields
            if (fields.length > 0) {
                const fieldValues = fields.map((field: any, index: number) => ({
                    formId: formId,
                    fieldKey: field.fieldKey,
                    label: field.label,
                    fieldType: field.fieldType,
                    placeholder: field.placeholder,
                    helpText: field.helpText,
                    defaultValue: field.defaultValue,
                    isRequired: field.isRequired || false,
                    options: field.options,
                    validationRules: field.validationRules,
                    conditionalLogic: field.conditionalLogic,
                    displayOrder: field.displayOrder ?? index,
                }));

                await db.insert(customFormFields).values(fieldValues);
            }
        }

        // Return updated form with fields
        const updatedFields = await db
            .select()
            .from(customFormFields)
            .where(eq(customFormFields.formId, formId))
            .orderBy(customFormFields.displayOrder);

        return res.status(200).json({ ...updatedForm, fields: updatedFields });
    } catch (err) {
        console.error("Error updating custom form:", err);
        return res.status(500).json({ error: "Failed to update custom form" });
    }
};

export const getEntityResponses = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { entityType, entityId } = req.params;

        const responses = await db
            .select()
            .from(customFormResponses)
            .where(
                and(
                    eq(customFormResponses.entityType, entityType),
                    eq(customFormResponses.entityId, entityId)
                )
            );

        return res.status(200).json(responses);
    } catch (err) {
        console.error("Error getting entity responses:", err);
        return res.status(500).json({ error: "Failed to get entity responses" });
    }
};

export const saveFormResponse = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { formId, entityType, entityId, responseData } = req.body;
        const submittedBy = req.user?.id; // From auth middleware

        if (!formId || !entityType || !entityId || !responseData) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if response already exists
        const [existingResponse] = await db
            .select()
            .from(customFormResponses)
            .where(
                and(
                    eq(customFormResponses.formId, formId),
                    eq(customFormResponses.entityType, entityType),
                    eq(customFormResponses.entityId, entityId)
                )
            );

        if (existingResponse) {
            // Update existing response
            const [updated] = await db
                .update(customFormResponses)
                .set({
                    responseData,
                    submittedBy,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(customFormResponses.id, existingResponse.id))
                .returning();

            return res.status(200).json(updated);
        } else {
            // Create new response
            const [newResponse] = await db
                .insert(customFormResponses)
                .values({
                    formId,
                    entityType,
                    entityId,
                    responseData,
                    submittedBy,
                })
                .returning();

            return res.status(201).json(newResponse);
        }
    } catch (err) {
        console.error("Error saving form response:", err);
        return res.status(500).json({ error: "Failed to save form response" });
    }
};
