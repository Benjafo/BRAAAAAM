import { Request, Response } from "express";
import { organizations } from "../drizzle/sys/schema.js";
import { eq, sql } from "drizzle-orm";
import { getSysDb } from "../drizzle/sys-client.js";
import { applyQueryFilters } from "../utils/queryParams.js";
import { createOrgDbFromTemplate } from "../drizzle/pool-manager.js";
import { roles, users } from "../drizzle/org/schema.js";
import { hashPassword } from "../utils/password.js";

// interface Organization {
//     id: string;
//     name: string;
//     domain?: string;
//     createdAt?: string;
//     updatedAt?: string;
// }

// const organizations: Organization[] = [];

export const listOrganizations = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = getSysDb();

        // Search + Sort + Pagination
        const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(req, [
            organizations.name,
            organizations.subdomain,
            organizations.pocEmail,
            organizations.pocPhone,
        ]);

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(organizations)
            .where(where);

        const data = await db
            .select({
                id: organizations.id,
                name: organizations.name,
                subdomain: organizations.subdomain,
                pocName: organizations.pocName,
                pocEmail: organizations.pocEmail,
                pocPhone: organizations.pocPhone,
                createdAt: organizations.createdAt,
                updatedAt: organizations.updatedAt,
                isActive: organizations.isActive,
            })
            .from(organizations)
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
        console.error("Error listing organizations:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const createOrganization = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = getSysDb();
        const {
            name,
            subdomain,
            phone,
            website,
            logoPath,
            pocName,
            pocEmail,
            pocPhone,
            attentionLine,
            addressLine1,
            addressLine2,
            city,
            state,
            zip,
            country,
            addressValidated,
        } = req.body;

        if (!name || !subdomain || !pocEmail || !attentionLine || !addressLine1 ||
            !city || !state || !zip || !country
        ) {
            return res.status(400).json({ message: "Missing required fields" });
        }



        const [newOrg] = await db
            .insert(organizations)
            .values({
                name,
                subdomain,
                logoPath,
                phone: phone ? "+1" + phone : phone, /**@TODO add proper validation here for phone numbers */
                website,
                attentionLine,
                addressLine1,
                addressLine2,
                city,
                state,
                zip,
                country,
                addressValidated /**@TODO check this if this is best way to pass in */,
                pocName,
                pocEmail,
                pocPhone: pocPhone ? "+1" + pocPhone : pocPhone,
                isActive: true,
            })
            .returning();

        const newOrgDb = await createOrgDbFromTemplate(
            newOrg.subdomain,
        );

        const [role] = await newOrgDb.select().from(roles).where(eq(roles.roleKey, 'admin')).limit(1);

        /**@TODO REMOVE DO NOT COMMIT DO NOT !!! */
        const pocInitialPassword = await hashPassword("Password123!");

        const [admin] = await newOrgDb
            .insert(users)
            .values({
                roleId: role.id,
                firstName: newOrg.pocName.split(" ")[0] || "Admin",
                lastName: newOrg.pocName.split(" ")[1] || "Admin",
                email: newOrg.pocEmail,
                phone: newOrg.pocPhone,
                passwordHash: pocInitialPassword,
            })
            .onConflictDoNothing()
            .returning();

        if(!admin) {
            console.warn(`Admin user for organization ${newOrg.name} was not created due to conflict.`);
        }
            

        return res.status(201).json(newOrg);
    } catch (err) {
        console.error("Error creating organization:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getOrganization = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = getSysDb();
        const { orgId } = req.params;

        const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));

        if (!org) {
            return res.status(404).json({ message: "Organization not found" });
        }

        return res.status(200).json(org);
    } catch (err) {
        console.error("Error fetching organization:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateOrganization = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = getSysDb();
        const { orgId } = req.params;
        const data = req.body;

        const [updatedOrg] = await db
            .update(organizations)
            .set({
                name: data.name,
                subdomain: data.subdomain,
                logoPath: data.logoPath,
                pocEmail: data.pocEmail,
                pocPhone: data.pocPhone,
                isActive: data.isActive,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(organizations.id, orgId))
            .returning();

        if (!updatedOrg) {
            return res.status(404).json({ message: "Organization not found" });
        }

        return res.status(200).json(updatedOrg);
    } catch (err) {
        console.error("Error updating organization:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
