export interface PermissionDefinition {
    permKey: string;
    resource: string;
    action: "read" | "create" | "update" | "delete" | "export" | "view" | "admin" | "manage";
    name: string;
    description: string;
}

export const PERMISSIONS: PermissionDefinition[] = [
    // Dashboard view (do we need this? Can we just check for the admin role?)
    {
        permKey: "dashboard.read",
        resource: "dashboard",
        action: "read",
        name: "View Dashboard",
        description: "Access the main dashboard",
    },

    // Users
    {
        permKey: "users.read",
        resource: "users",
        action: "read",
        name: "View Users",
        description: "View user list and details",
    },
    {
        permKey: "users.create",
        resource: "users",
        action: "create",
        name: "Create Users",
        description: "Create new user accounts",
    },
    {
        permKey: "users.update",
        resource: "users",
        action: "update",
        name: "Update Users",
        description: "Modify user information",
    },

    // Clients
    {
        permKey: "clients.read",
        resource: "clients",
        action: "read",
        name: "View Clients",
        description: "View client information",
    },
    {
        permKey: "clients.create",
        resource: "clients",
        action: "create",
        name: "Create Clients",
        description: "Add new clients",
    },
    {
        permKey: "clients.update",
        resource: "clients",
        action: "update",
        name: "Update Clients",
        description: "Modify client information",
    },

    // Appointments
    {
        permKey: "appointments.read",
        resource: "appointments",
        action: "read",
        name: "View Appointments",
        description: "View appointment schedule (may be limited to own appointments)",
    },
    {
        permKey: "appointments.create",
        resource: "appointments",
        action: "create",
        name: "Create Appointments",
        description: "Schedule new appointments",
    },
    {
        permKey: "appointments.update",
        resource: "appointments",
        action: "update",
        name: "Update Appointments",
        description: "Modify existing appointments (may be limited to own appointments)",
    },

    // Unavailability - All Users (Admin)
    {
        permKey: "allunavailability.read",
        resource: "allunavailability",
        action: "read",
        name: "View All Unavailability",
        description: "View unavailability periods for all users",
    },
    {
        permKey: "allunavailability.update",
        resource: "allunavailability",
        action: "update",
        name: "Update All Unavailability",
        description: "Modify unavailability periods for all users",
    },
    {
        permKey: "allunavailability.delete",
        resource: "allunavailability",
        action: "delete",
        name: "Delete All Unavailability",
        description: "Delete unavailability periods for all users",
    },

    // Unavailability - Own (Driver)
    {
        permKey: "ownunavailability.read",
        resource: "ownunavailability",
        action: "read",
        name: "View Own Unavailability",
        description: "View your own unavailability periods",
    },
    {
        permKey: "ownunavailability.create",
        resource: "ownunavailability",
        action: "create",
        name: "Create Own Unavailability",
        description: "Create your own unavailability periods",
    },
    {
        permKey: "ownunavailability.update",
        resource: "ownunavailability",
        action: "update",
        name: "Update Own Unavailability",
        description: "Modify your own unavailability periods",
    },
    {
        permKey: "ownunavailability.delete",
        resource: "ownunavailability",
        action: "delete",
        name: "Delete Own Unavailability",
        description: "Delete your own unavailability periods",
    },

    // Reports
    {
        permKey: "reports.export",
        resource: "reports",
        action: "export",
        name: "Export Reports",
        description: "Export report data to external formats",
    },
    {
        permKey: "reports.read",
        resource: "reports",
        action: "read",
        name: "Read Reports",
        description: "Read reports",
    },

    // Roles & Permissions
    {
        permKey: "roles.read",
        resource: "roles",
        action: "read",
        name: "View Roles",
        description: "View role configurations",
    },
    {
        permKey: "roles.create",
        resource: "roles",
        action: "create",
        name: "Create Roles",
        description: "Create custom roles",
    },
    {
        permKey: "roles.update",
        resource: "roles",
        action: "update",
        name: "Update Roles",
        description: "Modify role permissions",
    },
    {
        permKey: "roles.delete",
        resource: "roles",
        action: "delete",
        name: "Delete Roles",
        description: "Delete unused roles",
    },
    {
        permKey: "permissions.read",
        resource: "permissions",
        action: "read",
        name: "View Permissions",
        description: "View available permissions",
    },

    // Settings
    {
        permKey: "settings.read",
        resource: "settings",
        action: "read",
        name: "View Settings",
        description: "View system settings",
    },
    {
        permKey: "settings.update",
        resource: "settings",
        action: "update",
        name: "Update Settings",
        description: "Modify system settings",
    },

    // Organizations
    {
        permKey: "organizations.read",
        resource: "organizations",
        action: "read",
        name: "View Organizations",
        description: "View organizations",
    },
    {
        permKey: "organizations.create",
        resource: "organizations",
        action: "create",
        name: "Create Organizations",
        description: "Create organizations",
    },
    {
        permKey: "organizations.update",
        resource: "organizations",
        action: "update",
        name: "Update Organizations",
        description: "Modify organizations",
    },

    // Special Permissions
    // {
    //     permKey: "system.admin",
    //     resource: "system",
    //     action: "admin",
    //     name: "System Admin",
    //     description: "Full system access - overrides all permission checks",
    // },
];

// Helper function to get permission by key
export function getPermissionByKey(permKey: string): PermissionDefinition | undefined {
    return PERMISSIONS.find((p) => p.permKey === permKey);
}

// Helper function to get permissions by resource
export function getPermissionsByResource(resource: string): PermissionDefinition[] {
    return PERMISSIONS.filter((p) => p.resource === resource);
}

// Helper function to validate permission key
export function isValidPermissionKey(permKey: string): boolean {
    return PERMISSIONS.some((p) => p.permKey === permKey);
}
