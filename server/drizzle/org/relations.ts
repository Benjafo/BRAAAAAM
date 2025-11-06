import { relations } from "drizzle-orm/relations";
import {
    appointments,
    auditLogs,
    callLogs,
    callLogTypes,
    clients,
    customFormFields,
    customFormResponses,
    customForms,
    locations,
    messageRecipients,
    messages,
    permissions,
    rolePermissions,
    roles,
    userPermissions,
    users,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
    role: one(roles, {
        fields: [users.roleId],
        references: [roles.id],
    }),
    auditLogs: many(auditLogs),
    callLogs: many(callLogs),
    appointments_driverId: many(appointments, {
        relationName: "appointments_driverId_users_id",
    }),
    appointments_dispatcherId: many(appointments, {
        relationName: "appointments_dispatcherId_users_id",
    }),
    appointments_createdByUserId: many(appointments, {
        relationName: "appointments_createdByUserId_users_id",
    }),
    messages: many(messages),
    messageRecipients: many(messageRecipients),
    userPermissions: many(userPermissions),
    customFormResponses: many(customFormResponses),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
    users: many(users),
    rolePermissions: many(rolePermissions),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
    location: one(locations, {
        fields: [clients.addressLocation],
        references: [locations.id],
    }),
    appointments: many(appointments),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
    clients: many(clients),
    appointments_pickupLocation: many(appointments, {
        relationName: "appointments_pickupLocation_locations_id",
    }),
    appointments_destinationLocation: many(appointments, {
        relationName: "appointments_destinationLocation_locations_id",
    }),
}));

export const callLogsRelations = relations(callLogs, ({ one }) => ({
    user: one(users, {
        fields: [callLogs.createdByUserId],
        references: [users.id],
    }),
    callLogType: one(callLogTypes, {
        fields: [callLogs.callType],
        references: [callLogTypes.id],
    }),
}));

export const callLogTypesRelations = relations(callLogTypes, ({ many }) => ({
    callLogs: many(callLogs),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
    client: one(clients, {
        fields: [appointments.clientId],
        references: [clients.id],
    }),
    user_driverId: one(users, {
        fields: [appointments.driverId],
        references: [users.id],
        relationName: "appointments_driverId_users_id",
    }),
    user_dispatcherId: one(users, {
        fields: [appointments.dispatcherId],
        references: [users.id],
        relationName: "appointments_dispatcherId_users_id",
    }),
    user_createdByUserId: one(users, {
        fields: [appointments.createdByUserId],
        references: [users.id],
        relationName: "appointments_createdByUserId_users_id",
    }),
    location_pickupLocation: one(locations, {
        fields: [appointments.pickupLocation],
        references: [locations.id],
        relationName: "appointments_pickupLocation_locations_id",
    }),
    location_destinationLocation: one(locations, {
        fields: [appointments.destinationLocation],
        references: [locations.id],
        relationName: "appointments_destinationLocation_locations_id",
    }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
    user: one(users, {
        fields: [messages.senderId],
        references: [users.id],
    }),
    messageRecipients: many(messageRecipients),
}));

export const messageRecipientsRelations = relations(messageRecipients, ({ one }) => ({
    message: one(messages, {
        fields: [messageRecipients.messageId],
        references: [messages.id],
    }),
    user: one(users, {
        fields: [messageRecipients.userId],
        references: [users.id],
    }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, {
        fields: [rolePermissions.roleId],
        references: [roles.id],
    }),
    permission: one(permissions, {
        fields: [rolePermissions.permissionId],
        references: [permissions.id],
    }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
    rolePermissions: many(rolePermissions),
    userPermissions: many(userPermissions),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
    permission: one(permissions, {
        fields: [userPermissions.permissionId],
        references: [permissions.id],
    }),
    user: one(users, {
        fields: [userPermissions.userId],
        references: [users.id],
    }),
}));

// We need to check these... not fully sure if this is correct
export const customFormsRelations = relations(customForms, ({ many }) => ({
    fields: many(customFormFields),
    responses: many(customFormResponses),
}));
export const customFormFieldsRelations = relations(customFormFields, ({ one }) => ({
    form: one(customForms, {
        fields: [customFormFields.formId],
        references: [customForms.id],
    }),
}));
export const customFormResponsesRelations = relations(customFormResponses, ({ one }) => ({
    form: one(customForms, {
        fields: [customFormResponses.formId],
        references: [customForms.id],
    }),
    submitter: one(users, {
        fields: [customFormResponses.submittedBy],
        references: [users.id],
    }),
}));
