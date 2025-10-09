import { Request, Response } from "express";

/*
 * Example Client Output
    {
  "firstName": "string",
  "lastName": "string",
  "Email": "string",
  "Phone": "string",
  "contactPreference": "string",
  "Addresses": [
    {
      "Address Line 1": "string",
      "Address Line 2": "string",
      "City": "string",
      "State": "string",
      "Zip": "string",
      "Country": "string",
      "Is Primary": true,
      "vehiclePreferenceType": "string",
      "Notes": "string",
      "Gender": "Male"
    }
  ]
}
 */

// TODO: For future Controllers, make stubs without logic. Just return res.status(500) for now...
export const listClients = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const createClient = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const getClient = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const updateClient = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const deleteClient = (req: Request, res: Response): Response => {
    return res.status(500).send();
};