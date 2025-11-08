/**
 * A centralized list of all permissions used in the application.
 */
export const PERMISSIONS = {
    // Users
    USERS_READ: "users.read",
    USERS_CREATE: "users.create",
    USERS_UPDATE: "users.update",

    // Clients
    CLIENTS_READ: "clients.read",
    CLIENTS_CREATE: "clients.create",
    CLIENTS_UPDATE: "clients.update",

    // Appointments
    APPOINTMENTS_READ: "appointments.read",
    APPOINTMENTS_CREATE: "appointments.create",
    APPOINTMENTS_UPDATE: "appointments.update",

    // Reports
    REPORTS_READ: "reports.read",
    REPORTS_EXPORT: "reports.export",

    // Roles & Permissions
    ROLES_READ: "roles.read",
    ROLES_CREATE: "roles.create",
    ROLES_UPDATE: "roles.update",
    ROLES_DELETE: "roles.delete",

    // Settings
    SETTINGS_READ: "settings.read",
    SETTINGS_UPDATE: "settings.update",

    // Dashboard
    DASHBOARD_READ: "dashboard.read",

    // Organizations
    ORGANIZATIONS_READ: "organizations.read",
    ORGANIZATIONS_CREATE: "organizations.create",
    ORGANIZATIONS_UPDATE: "organizations.update",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Permission groups for UI organization
export const PERMISSION_GROUPS = {
    "User Management": [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_UPDATE],
    "Client Management": [
        PERMISSIONS.CLIENTS_READ,
        PERMISSIONS.CLIENTS_CREATE,
        PERMISSIONS.CLIENTS_UPDATE,
    ],
    Appointments: [
        PERMISSIONS.APPOINTMENTS_READ,
        PERMISSIONS.APPOINTMENTS_CREATE,
        PERMISSIONS.APPOINTMENTS_UPDATE,
    ],
    Reports: [PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT],
    Administration: [
        PERMISSIONS.ROLES_READ,
        PERMISSIONS.ROLES_CREATE,
        PERMISSIONS.ROLES_UPDATE,
        PERMISSIONS.SETTINGS_READ,
        PERMISSIONS.SETTINGS_UPDATE,
    ],
};
