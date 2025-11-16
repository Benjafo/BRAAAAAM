import { eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PERMISSIONS } from "../../config/permissions.config.js";
import { DEFAULT_ROLES } from "../../config/roles.config.js";
import * as orgSchema from "../org/schema.js";

type OrgDb = NodePgDatabase<typeof orgSchema>;

// Seed all permmissions from the config
export async function seedPermissions(db: OrgDb) {
    console.log("[seed] Starting permission seeding...");

    for (const permission of PERMISSIONS) {
        // Check if permission exists
        const existing = await db
            .select()
            .from(orgSchema.permissions)
            .where(eq(orgSchema.permissions.permKey, permission.permKey))
            .limit(1);

        if (existing.length === 0) {
            // Insert new permission
            await db.insert(orgSchema.permissions).values({
                permKey: permission.permKey,
                resource: permission.resource,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                action: permission.action as any, // Cast to match the enum type
                name: permission.name,
                description: permission.description,
            });
            console.log(`[seed] Created permission: ${permission.permKey}`);
        } else {
            // Update existing permission (in case definition changed)
            await db
                .update(orgSchema.permissions)
                .set({
                    resource: permission.resource,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    action: permission.action as any,
                    name: permission.name,
                    description: permission.description,
                })
                .where(eq(orgSchema.permissions.permKey, permission.permKey));
            console.log(`[seed] Updated permission: ${permission.permKey}`);
        }
    }

    console.log(`[seed] Seeded ${PERMISSIONS.length} permissions`);
}

/**
 * Seeds default roles and their permission mappings
 * Uses upsert pattern to be idempotent
 */
export async function seedRoles(db: OrgDb) {
    console.log("[seed] Starting role seeding...");

    for (const role of DEFAULT_ROLES) {
        // Check if role exists
        const [existingRole] = await db
            .select()
            .from(orgSchema.roles)
            .where(eq(orgSchema.roles.roleKey, role.roleKey))
            .limit(1);

        let roleId: string;

        if (!existingRole) {
            // Insert new role
            const [newRole] = await db
                .insert(orgSchema.roles)
                .values({
                    roleKey: role.roleKey,
                    name: role.name,
                    description: role.description,
                    isSystem: role.isSystem,
                    isDriverRole: role.isDriverRole,
                })
                .returning({ id: orgSchema.roles.id });

            roleId = newRole.id;
            console.log(`[seed] Created role: ${role.name}`);
        } else {
            // Update existing role (in case definition changed)
            await db
                .update(orgSchema.roles)
                .set({
                    name: role.name,
                    description: role.description,
                    isSystem: role.isSystem,
                    isDriverRole: role.isDriverRole,
                })
                .where(eq(orgSchema.roles.id, existingRole.id));

            roleId = existingRole.id;
            console.log(`[seed] Updated role: ${role.name}`);
        }

        // Map permissions to role
        await mapPermissionsToRole(db, roleId, role.permissions);
    }

    console.log(`[seed] Seeded ${DEFAULT_ROLES.length} roles`);
}

/**
 * Maps permissions to a role
 * Clears existing mappings and creates new ones
 */
async function mapPermissionsToRole(db: OrgDb, roleId: string, permissionKeys: string[]) {
    // Clear existing role permissions
    await db.delete(orgSchema.rolePermissions).where(eq(orgSchema.rolePermissions.roleId, roleId));

    // Get permission IDs for the given keys
    const permissions = await db
        .select()
        .from(orgSchema.permissions)
        .where(inArray(orgSchema.permissions.permKey, permissionKeys));

    // Create role-permission mappings
    for (const permission of permissions) {
        await db.insert(orgSchema.rolePermissions).values({
            roleId: roleId,
            permissionId: permission.id,
            grantAccess: true,
        });
    }

    console.log(`[seed] Mapped ${permissions.length} permissions to role ${roleId}`);
}

/**
 * Main seeding function that runs both permission and role seeding
 * This should be called in a transaction for atomicity
 */
export async function seedAll(db: OrgDb) {
    console.log("[seed] Starting complete seeding process...");

    try {
        await db.transaction(async (tx) => {
            // Permissions must be seeded first since roles reference them
            await seedPermissions(tx as OrgDb);
            await seedRoles(tx as OrgDb);
        });

        console.log("[seed] Complete seeding process finished successfully");
    } catch (error) {
        console.error("[seed] Seeding failed:", error);
        throw error;
    }
}

/**
 * Utility function to verify seeding was successful
 */
export async function verifySeed(db: OrgDb) {
    const permissionCount = await db
        .select({ count: orgSchema.permissions.id })
        .from(orgSchema.permissions);

    const roleCount = await db.select({ count: orgSchema.roles.id }).from(orgSchema.roles);

    const mappingCount = await db
        .select({ count: orgSchema.rolePermissions.roleId })
        .from(orgSchema.rolePermissions);

    console.log("[seed] Verification:");
    console.log(`  - Permissions: ${permissionCount.length}`);
    console.log(`  - Roles: ${roleCount.length}`);
    console.log(`  - Role-Permission Mappings: ${mappingCount.length}`);

    return {
        permissions: permissionCount.length,
        roles: roleCount.length,
        mappings: mappingCount.length,
    };
}
