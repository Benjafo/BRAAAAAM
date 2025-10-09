import { Request, Response } from "express";

/*
 * Example User Output
    {
        "firstName": "string",
        "lastName": "string",
        "Email": "string",
        "Phone": "string"
    }
 * Example Unavailability Output
    {
        "startDate": "string",
        "startTime": "string",
        "endDate": "string",
        "endTime": "string"
    }
 */

// TODO: For future Controllers, make stubs without logic. Just return res.status(500) for now...
export const listUsers = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const createUser = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const getUser = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const updateUser = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const deleteUser = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const createUnavailability = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const listUnavailability = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const updateUnavailability = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const deleteUnavailability = (req: Request, res: Response): Response => {
    return res.status(500).send();
};