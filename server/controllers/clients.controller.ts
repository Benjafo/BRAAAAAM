import { Request, Response } from "express";
import { clients, locations } from "../drizzle/org/schema.js";
import { eq, and } from "drizzle-orm";

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
        notes: clients.notes,
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
      .leftJoin(locations, eq(clients.addressLocation, locations.id)); // One-to-One join via foreign key

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error listing clients:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createClient = async (req: Request, res: Response): Promise<Response> => {
  try {
    const db = req.org?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const { firstName, lastName, email, phone, gender, contactPreference, address } = req.body;

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
        gender,
        contactPreference,
        livesAlone: false, // Currently defaulted, can be passed from front-end if needed
        addressLocation: addressId!,
      })
      .returning(); // Return full client row

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
        contactPreference: clients.contactPreference,
        gender: clients.gender,
        livesAlone: clients.livesAlone,
        address: {
          id: locations.id,
          addressLine1: locations.addressLine1,
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

    return res.status(200).json(clientData);
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

    const [updatedClient] = await db
      .update(clients)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        contactPreference: data.contactPreference,
        gender: data.gender,
        updatedAt: new Date().toISOString(), // Update timestamp manually
      })
      .where(eq(clients.id, clientId))
      .returning();

    // No client found
    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
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
