import { Request, Response } from "express";

type Address = {
  "Address Line 1": string;
  "Address Line 2": string;
  City: string;
  State: string;
  Zip: string;
  Country: string;
};

type Location = {
  id: number;
  Address: Address;
  Alias: string;
};

// Use database in Future
const LOCATIONS: Location[] = [
  {
    id: 1,
    Address: {
      "Address Line 1": "123 Main St",
      "Address Line 2": "",
      City: "Rochester",
      State: "NY",
      Zip: "14623",
      Country: "US",
    },
    Alias: "ROC",
  },
];

export const getCurrentLocation = (req: Request, res: Response): Response => {
  return res.json(LOCATIONS[0]);
};

export const createLocation = (req: Request, res: Response): Response => {
  const { Address, Alias } = req.body;

  if (!Address || !Alias) {
    return res.status(400).json({ error: "Address and Alias are required" });
  }

  const newLocation: Location = {
    id: LOCATIONS.length + 1,
    Address,
    Alias,
  };

  LOCATIONS.push(newLocation);
  return res.status(201).json(newLocation);
};

export const getLocation = (req: Request, res: Response): Response => {
  const { locationId } = req.params;
  const location = LOCATIONS.find((loc) => loc.id === Number(locationId));

  if (!location) {
    return res.status(404).json({ error: "Location not found" });
  }

  return res.json(location);
};

export const updateLocation = (req: Request, res: Response): Response => {
  const { locationId } = req.params;
  const { Address, Alias } = req.body;

  const index = LOCATIONS.findIndex((loc) => loc.id === Number(locationId));
  if (index === -1) {
    return res.status(404).json({ error: "Location not found" });
  }

  LOCATIONS[index] = { ...LOCATIONS[index], Address, Alias };
  return res.json(LOCATIONS[index]);
};

export const deleteLocation = (req: Request, res: Response): Response => {
  const { locationId } = req.params;
  const index = LOCATIONS.findIndex((loc) => loc.id === Number(locationId));

  if (index === -1) {
    return res.status(404).json({ error: "Location not found" });
  }

  LOCATIONS.splice(index, 1);
  return res.status(204).send();
};