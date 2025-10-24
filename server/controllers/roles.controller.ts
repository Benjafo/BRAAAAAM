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

interface Role {
    id: string;
    roleName: string;
    description: string;
    permissionIds: string[];
}

const roles: Role[] = [];

export const listRoles = (req: Request, res: Response): Response => {
    return res.status(200).json(roles);
    // return res.status(500).send();
};

export const createRole = (req: Request, res: Response): Response => {
    const data = req.body;

    if (!data.roleName || !data.description || !Array.isArray(data.permissionIds)) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // If no ID is given or it's already used, create one from roles.length + 1
    if (!data.id || roles.find((r) => r.id === data.id)) {
        data.id = (roles.length + 1).toString();
    }

    const newRole: Role = {
        id: data.id,
        roleName: data.roleName,
        description: data.description,
        permissionIds: data.permissionIds,
    };

    roles.push(newRole);
    return res.status(201).json(newRole);
    // return res.status(500).send();
};

export const getRole = (req: Request, res: Response): Response => {
    const { roleId } = req.params;
    const role = roles.find((r) => r.id === roleId);

    if (!role) {
        return res.status(404).json({ message: "Role not found" });
    }

    return res.status(200).json(role);
    // return res.status(500).send();
};

export const updateRole = (req: Request, res: Response): Response => {
    const { roleId } = req.params;
    const data = req.body;

    const index = roles.findIndex((r) => r.id === roleId);
    if (index === -1) {
        return res.status(404).json({ message: "Role not found" });
    }

    // Merge existing role data with updated fields
    roles[index] = { ...roles[index], ...data };
    return res.status(200).json(roles[index]);
    // return res.status(500).send();
};

export const deleteRole = (req: Request, res: Response): Response => {
    const { roleId } = req.params;

    const index = roles.findIndex((r) => r.id === roleId);
    if (index === -1) {
        return res.status(404).json({ message: "Role not found" });
    }

    roles.splice(index, 1);
    return res.status(204).send();
    // return res.status(500).send();
};
