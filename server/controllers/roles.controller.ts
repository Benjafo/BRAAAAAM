import { Request, Response } from "express";

/*
 * Example Output
    {
    "roleName": "string",
    "Description": "string",
    "PermissionIds": [
        "string"
        ]
    }
 */

// TODO: For future Controllers, make stubs without logic. Just return res.status(500) for now...
export const listRoles = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const createRole = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const getRole = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const updateRole = (req: Request, res: Response): Response => {
    return res.status(500).send();
};

export const deleteRole = (req: Request, res: Response): Response => {
    return res.status(500).send();
};
