import { Request, Response } from "express";
import { getSysDb } from "../drizzle/sys-client.js";
import { organizations } from "../drizzle/sys/schema.js";
import { eq } from "drizzle-orm";

export const getSettings = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = getSysDb();
        const subdomain = req.org?.subdomain;

        if (!subdomain) {
            return res.status(400).json({ error: "Organization subdomain not found" });
        }

        const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.subdomain, subdomain))
            .limit(1);

        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }

        return res.status(200).json(org);
    } catch (err) {
        console.error("Error fetching organization settings:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateSettings = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = getSysDb();
        const subdomain = req.org?.subdomain;

        if (!subdomain) {
            return res.status(400).json({ error: "Organization subdomain not found" });
        }

        const {
            name,
            logoPath,
            website,
            phone,
            email,
            attentionLine,
            addressLine1,
            addressLine2,
            city,
            state,
            zip,
            country,
            establishedDate,
        } = req.body;

        const [updatedOrg] = await db
            .update(organizations)
            .set({
                name,
                logoPath,
                website,
                phone,
                email,
                attentionLine,
                addressLine2,
                addressLine1,
                city,
                state,
                zip,
                country,
                establishedDate,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(organizations.subdomain, subdomain))
            .returning();

        if (!updatedOrg) {
            return res.status(404).json({ error: "Organization not found" });
        }

        return res.status(200).json(updatedOrg);
    } catch (err) {
        console.error("Error updating organization settings:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getOperationHours = (req: Request, res: Response): Response => {
    return res.status(500).send();
};
