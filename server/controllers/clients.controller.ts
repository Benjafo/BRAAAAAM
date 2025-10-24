import { Request, Response } from "express";

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

interface Address {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isPrimary: boolean;
  vehiclePreferenceType?: string;
  notes?: string;
  gender?: "Male" | "Female";
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  contactPreference: string;
  addresses: Address[];
}

const clients: Client[] = [];


export const listClients = (req: Request, res: Response): Response => {
  return res.status(200).json(clients);
  // return res.status(500).send();
};

export const createClient = (req: Request, res: Response): Response => {
  const data = req.body;

  if (!data.firstName || !data.lastName || !data.contactPreference) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // If no ID is given or it's already used, create one from clients.length + 1
  if (!data.id || clients.find((c) => c.id === data.id)) {
    data.id = (clients.length + 1).toString();
  }

  // Each address gets its own ID if missing or duplicated
  if (data.addresses && Array.isArray(data.addresses)) {
    data.addresses.forEach((a: Address, index: number) => {
      if (!a.id || data.addresses.some((x: Address, i: number) => i !== index && x.id === a.id)) {
        a.id = `${data.id}-${index + 1}`;
      }
    });
  }

  const newClient: Client = {
    id: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    contactPreference: data.contactPreference,
    addresses: data.addresses || [],
  };

  clients.push(newClient);
  return res.status(201).json(newClient);
  // return res.status(500).send();
};

export const getClient = (req: Request, res: Response): Response => {
  const { clientId } = req.params;
  const client = clients.find((c) => c.id === clientId);

  if (!client) {
    return res.status(404).json({ message: "Client not found" });
  }

  return res.status(200).json(client);
  // return res.status(500).send();
};

export const updateClient = (req: Request, res: Response): Response => {
  const { clientId } = req.params;
  const data = req.body;

  const index = clients.findIndex((c) => c.id === clientId);
  // No client with fetched ID
  if (index === -1) {
    return res.status(404).json({ message: "Client not found" });
  }

  // Merge existing client data with the new fields sent in req.body
  clients[index] = { ...clients[index], ...data };

  return res.status(200).json(clients[index]);
  // return res.status(500).send();
};

export const deleteClient = (req: Request, res: Response): Response => {
  const { clientId } = req.params;

  const index = clients.findIndex((c) => c.id === clientId);
  if (index === -1) {
    return res.status(404).json({ message: "Client not found" });
  }

  clients.splice(index, 1);
  return res.status(204).send();
  // return res.status(500).send();
};
