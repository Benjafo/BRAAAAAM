import { and, eq, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { permissions, rolePermissions, roles, users } from "../drizzle/org/schema.js";
import { applyQueryFilters } from "../utils/queryParams.js";

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

        // Define columns for searching, sorting, and filtering
        const searchableColumns = [roles.name, roles.description, roles.roleKey];

        const sortableColumns: Record<string, any> = {
            name: roles.name,
            description: roles.description,
            permissionCount: roles.name, // Can't sort by computed count, fallback to name
            createdAt: roles.createdAt,
        };

        const filterableColumns: Record<string, any> = {
            name: roles.name,
            description: roles.description,
        };

        const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(
            req,
            searchableColumns,
            sortableColumns,
            filterableColumns
        );

        // Exclude system roles from the list
        const whereClause = where
            ? and(where, eq(roles.isSystem, false))
            : eq(roles.isSystem, false);

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(roles)
            .where(whereClause);

        // Fetch all roles (excluding system roles)
        const data = await db
            .select({
                id: roles.id,
                roleKey: roles.roleKey,
                name: roles.name,
                description: roles.description,
                isSystem: roles.isSystem,
                isDriverRole: roles.isDriverRole,
                createdAt: roles.createdAt,
            })
            .from(roles)
            .where(whereClause)
            .orderBy(...(orderBy.length > 0 ? orderBy : []))
            .limit(limit)
            .offset(offset);

        // Get permission count for each role
        const rolesWithCounts = await Promise.all(
            data.map(async (role) => {
                const [{ count }] = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(rolePermissions)
                    .where(eq(rolePermissions.roleId, role.id));

                return {
                    ...role,
                    permissionCount: Number(count),
                };
            })
        );

        // Fetch all available permissions for the frontend
        const availablePermissions = await db
            .select({
                id: permissions.id,
                permKey: permissions.permKey,
                resource: permissions.resource,
                action: permissions.action,
                name: permissions.name,
                description: permissions.description,
            })
            .from(permissions)
            .orderBy(permissions.resource, permissions.action);

        return res.status(200).json({
            page,
            pageSize,
            total: Number(total),
            results: rolesWithCounts,
            availablePermissions,
        });
    } catch (err) {
        console.error("Error listing roles:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const createRole = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { roleName, description, isDriverRole, permissionIds } = req.body;

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
                isDriverRole: isDriverRole ?? false,
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
                isDriverRole: roles.isDriverRole,
            })
            .from(roles)
            .where(eq(roles.id, roleId));

        if (!roleData) {
            return res.status(404).json({ message: "Role not found" });
        }

        // Fetch permissions associated with this role
        const perms = await db
            .select({
                id: permissions.id,
                permKey: permissions.permKey,
                resource: permissions.resource,
                action: permissions.action,
                name: permissions.name,
                description: permissions.description,
            })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, roleId));

        return res.status(200).json({
            id: roleData.id,
            roleName: roleData.name,
            description: roleData.description,
            isSystem: roleData.isSystem,
            isDriverRole: roleData.isDriverRole,
            permissions: perms,
            permissionIds: perms.map((p) => p.id),
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
        const { roleName, description, isDriverRole, permissionIds } = req.body;

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
                isDriverRole: isDriverRole ?? false,
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

        // Fetch the role first to check if it's a system role
        const [role] = await db
            .select({ id: roles.id, isSystem: roles.isSystem, name: roles.name })
            .from(roles)
            .where(eq(roles.id, roleId));

        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        // Prevent deletion of system roles
        if (role.isSystem) {
            return res.status(403).json({ error: "Cannot delete system roles" });
        }

        // Check if any users have this role
        const usersWithRole = await db.select().from(users).where(eq(users.roleId, roleId));
        if (usersWithRole.length > 0) {
            return res.status(400).json({
                error: "Cannot delete role assigned to users",
                userCount: usersWithRole.length,
            });
        }

        // Delete rolePermissions first (if not already handled by Foreign Key cascade)
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

        // Delete the role
        await db.delete(roles).where(eq(roles.id, roleId));

        return res.status(204).send();
    } catch (err) {
        console.error("Error deleting role:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
