export interface RoleDefinition {
    roleKey: string;
    name: string;
    description: string;
    isSystem: boolean;
    permissions: string[];
}

export const DEFAULT_ROLES: RoleDefinition[] = [
    {
        roleKey: "super-admin",
        name: "Super Administrator",
        description: "Superuser with access to create and manage organizations",
        isSystem: true,
        permissions: ["organizations.read", "organizations.create", "organizations.update"],
    },
    {
        roleKey: "admin",
        name: "Administrator",
        description: "Administrative access for managing organization info",
        isSystem: false,
        permissions: [
            // Dashboard
            "dashboard.read",

            // Users
            "users.read",
            "users.create",
            "users.update",

            // Clients
            "clients.read",
            "clients.create",
            "clients.update",

            // Appointments
            "appointments.create",
            "appointments.read",
            "appointments.update",

            // Reports
            "reports.export",
            "reports.read",

            // Roles
            "roles.read",
            "roles.create",
            "roles.update",
            "roles.delete",

            // Permissions
            "permissions.read",

            // Settings
            "settings.read",
            "settings.update",
        ],
    },
    {
        roleKey: "dispatcher",
        name: "Dispatcher",
        description: "Manage appointments, clients, and drivers",
        isSystem: false,
        permissions: [
            // Users
            "users.read",
            "users.create",
            "users.update",
            "users.delete",

            // Clients
            "clients.read",
            "clients.create",
            "clients.update",
            "clients.delete",

            // Appointments
            "appointments.create",
            "appointments.read",
            "appointments.update",
        ],
    },
    {
        roleKey: "driver",
        name: "Driver",
        description: "View own appointments, view client information",
        isSystem: false,
        permissions: [
            "appointments.read",
            "clients.read",
            "unavailability.read",
            "unavailability.create",
            "unavailability.update",
            "unavailability.delete",
        ],
    },
];

// Get role by key
export function getRoleByKey(roleKey: string): RoleDefinition | undefined {
    return DEFAULT_ROLES.find((r) => r.roleKey === roleKey);
}

// Get system roles
export function getSystemRoles(): RoleDefinition[] {
    return DEFAULT_ROLES.filter((r) => r.isSystem);
}

// Get non-system roles
export function getCustomizableRoles(): RoleDefinition[] {
    return DEFAULT_ROLES.filter((r) => !r.isSystem);
}

// Check if a role key exists
export function isValidRoleKey(roleKey: string): boolean {
    return DEFAULT_ROLES.some((r) => r.roleKey === roleKey);
}

// Get all permissions for a role
// TODO wildcards
export function getExpandedPermissionsForRole(roleKey: string): string[] {
    const role = getRoleByKey(roleKey);
    if (!role) return [];

    if (role.permissions.includes("system.admin")) {
        // TODO: return all permissions from the PERMISSIONS config
        return ["system.admin"];
    }

    return role.permissions;
}
