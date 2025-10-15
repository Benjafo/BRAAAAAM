import { Request, Response } from "express";

/*
 * Example Location Output
  type Address = {
     "Address Line 1": string;
     "Address Line 2": string;
     City: string;
     State: string;
     Zip: string;
     Country: string;
   }

 */

interface LocationAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Location {
  id: string;
  alias: string;
  address: LocationAddress;
}

const locations: Location[] = [];

export const listLocations = (req: Request, res: Response): Response => {
  return res.status(200).json(locations);
};

export const createLocation = (req: Request, res: Response): Response => {
  const data = req.body;

  if (!data.address || !data.alias) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // If no ID is given or it's already used, create one from locations.length + 1
  if (!data.id || locations.find((l) => l.id === data.id)) {
    data.id = (locations.length + 1).toString();
  }

  const newLocation: Location = {
    id: data.id,
    address: data.address,
    alias: data.alias,
  };

  locations.push(newLocation);
  return res.status(201).json(newLocation);
  // return res.status(500).send();
};

export const getLocation = (req: Request, res: Response): Response => {
  const { locationId } = req.params;
  const location = locations.find((l) => l.id === locationId);

  if (!location) {
    return res.status(404).json({ message: "Location not found" });
  }

  return res.status(200).json(location);
  // return res.status(500).send();
};

export const updateLocation = (req: Request, res: Response): Response => {
  const { locationId } = req.params;
  const data = req.body;

  const index = locations.findIndex((l) => l.id === locationId);
  // No location with fetched ID
  if (index === -1) {
    return res.status(404).json({ message: "Location not found" });
  }

  // Merge existing location data with new data
  locations[index] = { ...locations[index], ...data };

  return res.status(200).json(locations[index]);
  // return res.status(500).send();
};

export const deleteLocation = (req: Request, res: Response): Response => {
  const { locationId } = req.params;

  const index = locations.findIndex((l) => l.id === locationId);
  if (index === -1) {
    return res.status(404).json({ message: "Location not found" });
  }

  locations.splice(index, 1);
  return res.status(204).send();
  // return res.status(500).send();
};