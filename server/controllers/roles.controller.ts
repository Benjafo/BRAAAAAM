import { Request, Response } from "express";
import { roles, rolePermissions } from "../drizzle/org/schema";
import { eq } from "drizzle-orm";

/*
 * Example Output
    {
        "roleName": "string",
        "description": "string",
        "permissionIds": [
            "string"
        ]
    }
 */

export const listRoles = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Fetch all roles
        const data = await db
            .select({
                id: roles.id,
                roleKey: roles.roleKey,
                name: roles.name,
                description: roles.description,
                isSystem: roles.isSystem,
                createdAt: roles.createdAt,
            })
            .from(roles);

        return res.status(200).json(data);
    } catch (err) {
        console.error("Error listing roles:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const createRole = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { roleName, description, permissionIds } = req.body;

        if (!roleName || !description || !Array.isArray(permissionIds)) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Insert role
        const [newRole] = await db
            .insert(roles)
            .values({
                roleKey: roleName.toLowerCase().replace(/\s+/g, "-"),
                name: roleName,
                description,
                isSystem: false,
            })
            .returning();

        // Insert rolePermissions if any
        if (permissionIds.length > 0) {
            await db.insert(rolePermissions).values(
                permissionIds.map((pid: string) => ({
                    roleId: newRole.id,
                    permissionId: pid,
                    grantAccess: true,
                }))
            );
        }

        return res.status(201).json({
            id: newRole.id,
            roleName: newRole.name,
            description: newRole.description,
            permissionIds,
        });
    } catch (err) {
        console.error("Error creating role:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getRole = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { roleId } = req.params;

        const [roleData] = await db
            .select({
                id: roles.id,
                name: roles.name,
                description: roles.description,
                isSystem: roles.isSystem,
            })
            .from(roles)
            .where(eq(roles.id, roleId));

        if (!roleData) {
            return res.status(404).json({ message: "Role not found" });
        }

        // Fetch permissions associated with this role
        const perms = await db
            .select({
                permissionId: rolePermissions.permissionId,
            })
            .from(rolePermissions)
            .where(eq(rolePermissions.roleId, roleId));

        return res.status(200).json({
            id: roleData.id,
            roleName: roleData.name,
            description: roleData.description,
            permissionIds: perms.map((p) => p.permissionId),
        });
    } catch (err) {
        console.error("Error fetching role:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateRole = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { roleId } = req.params;
        const { roleName, description, permissionIds } = req.body;

        const [existingRole] = await db
            .select({ id: roles.id })
            .from(roles)
            .where(eq(roles.id, roleId));

        if (!existingRole) {
            return res.status(404).json({ message: "Role not found" });
        }

        // Update role data
        const [updatedRole] = await db
            .update(roles)
            .set({
                name: roleName,
                description,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(roles.id, roleId))
            .returning();

        // Replace existing permissions
        if (Array.isArray(permissionIds)) {
            await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

            if (permissionIds.length > 0) {
                await db.insert(rolePermissions).values(
                    permissionIds.map((pid: string) => ({
                        roleId,
                        permissionId: pid,
                        grantAccess: true,
                    }))
                );
            }
        }

        return res.status(200).json({
            id: updatedRole.id,
            roleName: updatedRole.name,
            description: updatedRole.description,
            permissionIds,
        });
    } catch (err) {
        console.error("Error updating role:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteRole = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { roleId } = req.params;

        const result = await db.delete(roles).where(eq(roles.id, roleId));

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Role not found" });
        }

        // Delete rolePermissions (if not already handled by Foreign Key)
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

        return res.status(204).send();
    } catch (err) {
        console.error("Error deleting role:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
