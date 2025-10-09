import { Request, Response } from "express";

/*
 * Example Output
    {
    "startDate": "string",
    "startTime": "string",
    "estimatedEndDate": "string",
    "estimatedEndTime": "string",
    "Client": [
        "string"
    ],
    "pickupLocation": "string",
    "dropoffLocation": "string",
    "status": "string"
    }
 */

// TODO: For future Controllers, make stubs without logic. Just return res.status(500) for now...
export const listAppointments = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const createAppointment = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const getAppointment = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const updateAppointment = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const listTags = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const createTag = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const updateTag = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const deleteTag = (req: Request, res: Response): Response => {
    return res.status(500).send();
};
