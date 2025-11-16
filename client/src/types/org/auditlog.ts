export type AuditLogEntry = {
    audit_logs: {
        id: string;
        userId: string | null;
        objectId: string | null;
        objectType: string | null;
        actionType: string;
        actionMessage: string | null;
        actionDetails: Record<string, any>;
        createdAt: string;
    };
    users: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
    };
};

export type AuditLogModalEntry = {
    id: string;
    userId: string | null;
    objectId: string | null;
    objectType: string | null;
    actionType: string;
    actionMessage: string | null;
    actionDetails: string;
    createdAt: string;
    userName: string | null;
    date: string;
    time: string;
    formattedObjectType: string | null;
    formattedAction: string;
};
