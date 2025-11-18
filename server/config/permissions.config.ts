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

    // Appointments - All (Dispatcher/Admin access)
    {
        permKey: "allappointments.read",
        resource: "allappointments",
        action: "read",
        name: "View All Appointments",
        description: "View all appointments for all drivers",
    },
    {
        permKey: "allappointments.create",
        resource: "allappointments",
        action: "create",
        name: "Create All Appointments",
        description: "Create appointments for any driver",
    },
    {
        permKey: "allappointments.update",
        resource: "allappointments",
        action: "update",
        name: "Update All Appointments",
        description: "Modify any appointment",
    },

    // Appointments - Own (Driver access)
    {
        permKey: "ownappointments.read",
        resource: "ownappointments",
        action: "read",
        name: "View Own Appointments",
        description: "View unassigned appointments and appointments assigned to you",
    },
    {
        permKey: "ownappointments.update",
        resource: "ownappointments",
        action: "update",
        name: "Update Own Appointments",
        description: "Modify appointments assigned to you",
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

    // Volunteer Records - Own
    {
        permKey: "ownvolunteer-records.read",
        resource: "ownvolunteer-records",
        action: "read",
        name: "View Own Volunteer Records",
        description: "View your own volunteer hours and miles records",
    },
    {
        permKey: "ownvolunteer-records.create",
        resource: "ownvolunteer-records",
        action: "create",
        name: "Create Own Volunteer Records",
        description: "Create your own volunteer hours and miles records",
    },
    {
        permKey: "ownvolunteer-records.update",
        resource: "ownvolunteer-records",
        action: "update",
        name: "Update Own Volunteer Records",
        description: "Modify your own volunteer hours and miles records",
    },
    {
        permKey: "ownvolunteer-records.delete",
        resource: "ownvolunteer-records",
        action: "delete",
        name: "Delete Own Volunteer Records",
        description: "Delete your own volunteer hours and miles records",
    },

    // Volunteer Records - All
    {
        permKey: "allvolunteer-records.read",
        resource: "allvolunteer-records",
        action: "read",
        name: "View All Volunteer Records",
        description: "View volunteer hours and miles records for all users",
    },
    {
        permKey: "allvolunteer-records.update",
        resource: "allvolunteer-records",
        action: "update",
        name: "Update All Volunteer Records",
        description: "Modify volunteer hours and miles records for all users",
    },
    {
        permKey: "allvolunteer-records.delete",
        resource: "allvolunteer-records",
        action: "delete",
        name: "Delete All Volunteer Records",
        description: "Delete all volunteer hours and miles records",
    },

    // Notifications - Own (Driver)
    {
        permKey: "ownnotifications.read",
        resource: "ownnotifications",
        action: "read",
        name: "View Own Notifications",
        description: "View notifications sent to you",
    },

    // Notifications - All (Dispatcher/Admin)
    {
        permKey: "allnotifications.read",
        resource: "allnotifications",
        action: "read",
        name: "View All Notifications",
        description: "View all notifications (queued, sent, failed)",
    },
    {
        permKey: "allnotifications.update",
        resource: "allnotifications",
        action: "update",
        name: "Manage All Notifications",
        description: "Retry failed or cancel queued notifications",
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
