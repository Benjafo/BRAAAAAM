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

    // Appointments - Own
    OWN_APPOINTMENTS_READ: "ownappointments.read",
    OWN_APPOINTMENTS_UPDATE: "ownappointments.update",

    // Appointments - All
    ALL_APPOINTMENTS_READ: "allappointments.read",
    ALL_APPOINTMENTS_CREATE: "allappointments.create",
    ALL_APPOINTMENTS_UPDATE: "allappointments.update",

    // Unavailability - All Users
    ALL_UNAVAILABILITY_READ: "allunavailability.read",
    ALL_UNAVAILABILITY_UPDATE: "allunavailability.update",
    ALL_UNAVAILABILITY_DELETE: "allunavailability.delete",

    // Unavailability - Own
    OWN_UNAVAILABILITY_READ: "ownunavailability.read",
    OWN_UNAVAILABILITY_CREATE: "ownunavailability.create",
    OWN_UNAVAILABILITY_UPDATE: "ownunavailability.update",
    OWN_UNAVAILABILITY_DELETE: "ownunavailability.delete",

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

    // Volunteer Records - Own
    OWN_VOLUNTEER_RECORDS_READ: "ownvolunteer-records.read",
    OWN_VOLUNTEER_RECORDS_CREATE: "ownvolunteer-records.create",
    OWN_VOLUNTEER_RECORDS_UPDATE: "ownvolunteer-records.update",
    OWN_VOLUNTEER_RECORDS_DELETE: "ownvolunteer-records.delete",

    // Volunteer Records - All
    ALL_VOLUNTEER_RECORDS_READ: "allvolunteer-records.read",
    ALL_VOLUNTEER_RECORDS_UPDATE: "allvolunteer-records.update",
    ALL_VOLUNTEER_RECORDS_DELETE: "allvolunteer-records.delete",

    // Notifications - Own
    OWN_NOTIFICATIONS_READ: "ownnotifications.read",

    // Notifications - All
    ALL_NOTIFICATIONS_READ: "allnotifications.read",
    ALL_NOTIFICATIONS_UPDATE: "allnotifications.update",
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
        PERMISSIONS.OWN_APPOINTMENTS_READ,
        PERMISSIONS.OWN_APPOINTMENTS_UPDATE,
        PERMISSIONS.ALL_APPOINTMENTS_READ,
        PERMISSIONS.ALL_APPOINTMENTS_CREATE,
        PERMISSIONS.ALL_APPOINTMENTS_UPDATE,
    ],
    Unavailability: [
        PERMISSIONS.ALL_UNAVAILABILITY_READ,
        PERMISSIONS.ALL_UNAVAILABILITY_UPDATE,
        PERMISSIONS.ALL_UNAVAILABILITY_DELETE,
        PERMISSIONS.OWN_UNAVAILABILITY_READ,
        PERMISSIONS.OWN_UNAVAILABILITY_CREATE,
        PERMISSIONS.OWN_UNAVAILABILITY_UPDATE,
        PERMISSIONS.OWN_UNAVAILABILITY_DELETE,
    ],
    Reports: [PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT],
    "Volunteer Records": [
        PERMISSIONS.OWN_VOLUNTEER_RECORDS_READ,
        PERMISSIONS.OWN_VOLUNTEER_RECORDS_CREATE,
        PERMISSIONS.OWN_VOLUNTEER_RECORDS_UPDATE,
        PERMISSIONS.OWN_VOLUNTEER_RECORDS_DELETE,
        PERMISSIONS.ALL_VOLUNTEER_RECORDS_READ,
        PERMISSIONS.ALL_VOLUNTEER_RECORDS_UPDATE,
        PERMISSIONS.ALL_VOLUNTEER_RECORDS_DELETE,
    ],
    Administration: [
        PERMISSIONS.ROLES_READ,
        PERMISSIONS.ROLES_CREATE,
        PERMISSIONS.ROLES_UPDATE,
        PERMISSIONS.SETTINGS_READ,
        PERMISSIONS.SETTINGS_UPDATE,
    ],
};
