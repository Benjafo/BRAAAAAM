import { Request, Response } from "express";
import { organizations } from "../drizzle/sys/schema.js";
import { eq } from "drizzle-orm";
import { getSysDb } from "../drizzle/sys-client.js"

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
    const data = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        subdomain: organizations.subdomain,
        logoPath: organizations.logoPath,
        pocEmail: organizations.pocEmail,
        pocPhone: organizations.pocPhone,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        isActive: organizations.isActive,
      })
      .from(organizations);

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error listing organizations:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createOrganization = async (req: Request, res: Response): Promise<Response> => {
  try {
    const db = getSysDb();
    const { name, subdomain, logoPath, pocName, pocEmail, pocPhone, addressLine1, addressLine2, city, state, zip, country, addressValidated } = req.body;

    if (!name || !subdomain || !pocEmail) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [newOrg] = await db
      .insert(organizations)
      .values({
        name,
        subdomain,
        logoPath,
        addressLine1,
        addressLine2,
        city,
        state,
        zip,
        country,
        addressValidated, /**@TODO check this if this is best way to pass in */
        pocName,
        pocEmail,
        pocPhone,
        isActive: true,
      })
      .returning();

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

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId));

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
