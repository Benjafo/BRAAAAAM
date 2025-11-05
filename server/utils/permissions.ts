/**
 * Core permission checking utilities
 * These functions handle permission validation
 */

import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as orgSchema from "../drizzle/org/schema.js";

type OrgDb = NodePgDatabase<typeof orgSchema>;

/**
 * Get effective permissions for a user
 * Combines role permissions and user-specific permission overrides
 */
export async function getUserPermissions(userId: string, orgDb: OrgDb): Promise<string[]> {
    // Query user with role
    const [user] = await orgDb
        .select({
            id: orgSchema.users.id,
            roleId: orgSchema.users.roleId,
        })
        .from(orgSchema.users)
        .where(eq(orgSchema.users.id, userId))
        .limit(1);

    if (!user) {
        return [];
    }

    const effectivePermissions = new Set<string>();

    // Get role permissions if user has a role
    if (user.roleId) {
        const rolePermissions = await orgDb
            .select({
                permKey: orgSchema.permissions.permKey,
                grantAccess: orgSchema.rolePermissions.grantAccess,
            })
            .from(orgSchema.rolePermissions)
            .innerJoin(
                orgSchema.permissions,
                eq(orgSchema.rolePermissions.permissionId, orgSchema.permissions.id)
            )
            .where(eq(orgSchema.rolePermissions.roleId, user.roleId));

        // Add role permissions where grantAccess is true
        rolePermissions.forEach((rp) => {
            if (rp.grantAccess) {
                effectivePermissions.add(rp.permKey);
            }
        });
    }

    // Get user-specific permission overrides
    const userPermissions = await orgDb
        .select({
            permKey: orgSchema.permissions.permKey,
            grantAccess: orgSchema.userPermissions.grantAccess,
        })
        .from(orgSchema.userPermissions)
        .innerJoin(
            orgSchema.permissions,
            eq(orgSchema.userPermissions.permissionId, orgSchema.permissions.id)
        )
        .where(eq(orgSchema.userPermissions.userId, userId));

    // Apply user permission overrides
    userPermissions.forEach((up) => {
        if (up.grantAccess) {
            effectivePermissions.add(up.permKey);
        } else {
            // If grantAccess is false, it revokes the permission
            effectivePermissions.delete(up.permKey);
        }
    });

    const permissionsArray = Array.from(effectivePermissions);
    return permissionsArray;
}

/**
 * Check if a user has a specific permission
 * Handles special cases like system.admin and wildcards
 */
export async function hasPermission(
    userId: string,
    permission: string,
    orgDb: OrgDb
): Promise<boolean> {
    const userPermissions = await getUserPermissions(userId, orgDb);

    // Check for system.admin (super permission)
    if (userPermissions.includes("system.admin")) {
        return true;
    }

    // Check for exact permission
    if (userPermissions.includes(permission)) {
        return true;
    }

    // Check for wildcard permissions (e.g., users.* matches users.read)
    const [resource, action] = permission.split(".");
    if (resource && action) {
        // Check for resource wildcard (e.g., users.*)
        if (userPermissions.includes(`${resource}.*`)) {
            return true;
        }

        // Check for action wildcard (e.g., *.read)
        if (userPermissions.includes(`*.${action}`)) {
            return true;
        }

        // Check for full wildcard (*.*)
        if (userPermissions.includes("*.*")) {
            return true;
        }
    }

    return false;
}

/**
 * Check if a user has ANY of the specified permissions
 */
export async function hasAnyPermission(
    userId: string,
    permissions: string[],
    orgDb: OrgDb
): Promise<boolean> {
    for (const permission of permissions) {
        if (await hasPermission(userId, permission, orgDb)) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a user has ALL of the specified permissions
 */
export async function hasAllPermissions(
    userId: string,
    permissions: string[],
    orgDb: OrgDb
): Promise<boolean> {
    for (const permission of permissions) {
        if (!(await hasPermission(userId, permission, orgDb))) {
            return false;
        }
    }
    return true;
}

/**
 * Get user's role information
 */
export async function getUserRole(
    userId: string,
    orgDb: OrgDb
): Promise<{ roleId: string; roleKey: string; roleName: string } | null> {
    const [result] = await orgDb
        .select({
            roleId: orgSchema.roles.id,
            roleKey: orgSchema.roles.roleKey,
            roleName: orgSchema.roles.name,
        })
        .from(orgSchema.users)
        .leftJoin(orgSchema.roles, eq(orgSchema.users.roleId, orgSchema.roles.id))
        .where(eq(orgSchema.users.id, userId))
        .limit(1);

    if (!result || !result.roleId) {
        return null;
    }

    return {
        roleId: result.roleId,
        roleKey: result.roleKey ? result.roleKey : "",
        roleName: result.roleName ? result.roleName : "",
    };
}

/**
 * Check if a user can grant a specific permission to others
 * Users can only grant permissions they have themselves (unless they're system admin)
 */
export async function canGrantPermission(
    grantorId: string,
    permission: string,
    orgDb: OrgDb
): Promise<boolean> {
    return await hasPermission(grantorId, permission, orgDb);
}

/**
 * Check if a role is a system role
 */
export async function isSystemRole(roleId: string, orgDb: OrgDb): Promise<boolean> {
    const [role] = await orgDb
        .select({ isSystem: orgSchema.roles.isSystem })
        .from(orgSchema.roles)
        .where(eq(orgSchema.roles.id, roleId))
        .limit(1);

    return role?.isSystem ?? false;
}

/**
 * Get all available permissions in the system
 */
export async function getAllPermissions(orgDb: OrgDb) {
    return await orgDb
        .select({
            id: orgSchema.permissions.id,
            permKey: orgSchema.permissions.permKey,
            resource: orgSchema.permissions.resource,
            action: orgSchema.permissions.action,
            name: orgSchema.permissions.name,
            description: orgSchema.permissions.description,
        })
        .from(orgSchema.permissions)
        .orderBy(orgSchema.permissions.resource, orgSchema.permissions.action);
}

/**
 * Get permissions grouped by resource
 */
export async function getPermissionsByResource(orgDb: OrgDb) {
    const permissions = await getAllPermissions(orgDb);

    const grouped = permissions.reduce(
        (acc, perm) => {
            if (!acc[perm.resource]) {
                acc[perm.resource] = [];
            }
            acc[perm.resource].push(perm);
            return acc;
        },
        {} as Record<string, typeof permissions>
    );

    return grouped;
}
