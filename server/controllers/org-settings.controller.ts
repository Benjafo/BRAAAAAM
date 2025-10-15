import { Request, Response } from "express";

interface HoursOfOperation {
    id: string;
    dayOfWeek: number; // 0–6
    startTime: string;
    endTime: string;
}

interface OrgSettings {
    id: string;
    name?: string;
    logo?: string;
    domain?: string;
    phone?: string;
    email?: string;
    streetAddress1?: string;
    streetAddress2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    postmarkApiKey?: string;
    googleMapsApiKey?: string;
    hoursOfOperation?: HoursOfOperation[];
}

const orgSettings: OrgSettings[] = [];


// TODO: For future Controllers, make stubs without logic. Just return res.status(500) for now...
export const getSettings = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const updateSettings = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const getOperationHours = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

// TODO: Seperate Forms into its own controller

export const listForms = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const createForm = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const getForm = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const updateForm = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const listAuditLog = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const getAuditLogEntry = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const getPermissions = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const getCurrentLocation = (req: Request, res: Response): Response => {
    return res.status(500).send();
};