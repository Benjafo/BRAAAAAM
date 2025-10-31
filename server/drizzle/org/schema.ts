import { sql } from "drizzle-orm";
import {
    boolean,
    check,
    date,
    foreignKey,
    index,
    integer,
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    time,
    timestamp,
    unique,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

export const appointmentStatus = pgEnum("appointment_status", [
    "Unassigned",
    "Scheduled",
    "Cancelled",
    "Completed",
    "Withdrawn",
]);
export const auditAction = pgEnum("audit_action", ["auth", "add", "change", "delete", "error"]);
export const contactPreference = pgEnum("contact_preference", ["email", "phone"]);
export const donationType = pgEnum("donation_type", [
    "Cash",
    "Check",
    "Envelope",
    "Electronic",
    "None",
]);
export const genderOptions = pgEnum("gender_options", ["Male", "Female", "Other"]);
export const messageStatus = pgEnum("message_status", ["sent", "pending", "failed"]);
export const messageType = pgEnum("message_type", ["Email", "Text Message"]);
export const permissionAction = pgEnum("permission_action", [
    "read",
    "create",
    "update",
    "delete",
    "export",
]);

export const roles = pgTable(
    "roles",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        roleKey: text("role_key").notNull(),
        name: text().notNull(),
        description: text().notNull(),
        isSystem: boolean("is_system").default(false).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        unique("roles_role_key_key").on(table.roleKey),
        check("roles_role_key_slug_format", sql`role_key ~ '^[a-z0-9][a-z0-9.-]*$'::text`),
    ]
);

export const permissions = pgTable(
    "permissions",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        permKey: text("perm_key").notNull(),
        resource: text("resource").notNull(),
        action: permissionAction().notNull(),
        name: varchar({ length: 255 }).notNull(),
        description: text().notNull(),
    },
    (table) => [
        index("idx_permissions_resource_action").using(
            "btree",
            table.resource.asc().nullsLast(),
            table.action.asc().nullsLast()
        ),
        unique("permissions_perm_key_key").on(table.permKey),
        check("permissions_perm_key_slug_format", sql`perm_key ~ '^[a-z0-9][a-z0-9.-]*$'::text`),
        // Cast enum to text explicitly for deterministic behavior:
        check(
            "permissions_perm_key_format",
            sql`(perm_key)::text = (((resource)::text || '.'::text) || (action)::text)`
        ),
        check("permissions_resource_slug_format", sql`resource ~ '^[a-z0-9][a-z0-9.-]*$'::text`),
    ]
);

export const users = pgTable(
    "users",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        firstName: varchar("first_name", { length: 100 }).notNull(),
        lastName: varchar("last_name", { length: 100 }).notNull(),
        email: varchar("email", { length: 255 }).notNull(),
        phone: text("phone"),
        contactPreference: contactPreference("contact_preference").default("email").notNull(),
        passwordHash: varchar("password_hash", { length: 255 }),
        roleId: uuid("role_id"),
        addressLocation: uuid("address_location"),
        isDriver: boolean("is_driver").default(false),
        isActive: boolean("is_active").default(true),
        isDeleted: boolean("is_deleted").default(false),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("users_address_idx").using(
            "btree",
            table.addressLocation.asc().nullsLast().op("uuid_ops")
        ),
        foreignKey({
            columns: [table.roleId],
            foreignColumns: [roles.id],
            name: "users_role_fkey",
        }).onDelete("set null"),
        foreignKey({
            columns: [table.addressLocation],
            foreignColumns: [locations.id],
            name: "users_address_location_fkey",
        })
            .onUpdate("cascade")
            .onDelete("restrict"),
        unique("users_email_key").on(table.email),
        check(
            "users_phone_e164_check",
            sql`(phone IS NULL) OR (phone ~ '^\\+[1-9][1-9]{1,14}$'::text)`
        ),
    ]
);

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        userId: uuid("user_id"),
        objectId: uuid("object_id"),
        actionType: auditAction("action_type").notNull(),
        actionMessage: text("action_message"),
        actionDetails: jsonb("action_details").default({}).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        // `.op("enum_ops")` is optional; PG will pick it for enums.
        index("idx_audit_action_type").using("btree", table.actionType.asc().nullsLast()),
        index("idx_audit_created_at").using(
            "btree",
            table.createdAt.asc().nullsLast().op("timestamptz_ops")
        ),
        index("idx_audit_details_gin").using(
            "gin",
            table.actionDetails.asc().nullsLast().op("jsonb_ops")
        ),
        index("idx_audit_object").using("btree", table.objectId.asc().nullsLast().op("uuid_ops")),
        index("idx_audit_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "audit_logs_user_id_fkey",
        }).onDelete("set null"),
    ]
);

export const locations = pgTable(
    "locations",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        aliasName: varchar("alias_name", { length: 255 }),
        addressLine1: varchar("address_line_1", { length: 255 }).notNull(),
        addressLine2: varchar("address_line_2", { length: 255 }),
        city: varchar({ length: 100 }).notNull(),
        state: varchar({ length: 50 }).notNull(),
        zip: varchar({ length: 20 }).notNull(),
        country: varchar({ length: 100 }).notNull(),
        addressValidated: boolean("address_validated").default(false),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex("locations_address_unique").using(
            "btree",
            sql`lower((address_line_1)::text)`,
            sql`COALESCE(lower((address_line_2)::text), ''::text)`,
            sql`lower((city)::text)`,
            sql`lower((state)::text)`,
            sql`lower((zip)::text)`,
            sql`lower((country)::text)`
        ),
        index("locations_alias_trgm_idx").using(
            "gin",
            table.aliasName.asc().nullsLast().op("gin_trgm_ops")
        ),
        index("locations_city_state_idx").using(
            "btree",
            table.city.asc().nullsLast().op("text_ops"),
            table.state.asc().nullsLast().op("text_ops")
        ),
        index("locations_state_idx").using("btree", table.state.asc().nullsLast().op("text_ops")),
        index("locations_zip_idx").using("btree", table.zip.asc().nullsLast().op("text_ops")),
    ]
);

export const clients = pgTable(
    "clients",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        firstName: varchar("first_name", { length: 100 }).notNull(),
        lastName: varchar("last_name", { length: 100 }).notNull(),
        email: varchar("email", { length: 255 }),
        phone: text("phone").notNull(),
        phoneIsCell: boolean("phone_is_cell").default(false).notNull(),
        secondaryPhone: text("secondary_phone"),
        secondaryPhoneIsCell: boolean("secondary_phone_is_cell").default(false).notNull(),
        contactPreference: contactPreference("contact_preference").default("phone").notNull(),
        allowMessages: boolean("allow_messages").default(false).notNull(),
        gender: genderOptions().notNull(),
        birthYear: integer("birth_year"),
        birthMonth: integer("birth_month"),
        livesAlone: boolean("lives_alone").notNull(),
        addressLocation: uuid("address_location").notNull(),
        notes: text(),
        isActive: boolean("is_active").default(true),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("clients_active_true")
            .using("btree", table.id.asc().nullsLast().op("uuid_ops"))
            .where(sql`is_active`),
        index("clients_address_idx").using(
            "btree",
            table.addressLocation.asc().nullsLast().op("uuid_ops")
        ),
        index("clients_cell_only_idx")
            .using("btree", table.phone.asc().nullsLast().op("text_ops"))
            .where(sql`phone_is_cell`),
        index("clients_created_at_idx").using(
            "btree",
            table.createdAt.desc().nullsFirst().op("timestamptz_ops")
        ),
        index("clients_email_trgm_idx").using(
            "gin",
            table.email.asc().nullsLast().op("gin_trgm_ops")
        ),
        // Case-insensitive unique on email, nullable-safe:
        uniqueIndex("clients_email_uq")
            .using("btree", sql`lower((email)::text)`)
            .where(sql`(email IS NOT NULL)`),
        index("clients_full_name_trgm_idx").using(
            "gin",
            sql`(first_name::text || ' '::text || last_name::text) gin_trgm_ops`
        ),
        index("clients_last_name_trgm_idx").using(
            "gin",
            table.lastName.asc().nullsLast().op("gin_trgm_ops")
        ),
        foreignKey({
            columns: [table.addressLocation],
            foreignColumns: [locations.id],
            name: "clients_address_location_fkey",
        })
            .onUpdate("cascade")
            .onDelete("restrict"),
        unique("clients_phone_key").on(table.phone),
        check(
            "clients_birth_year_check",
            sql`(birth_year IS NULL) OR ((birth_year >= 1900) AND (birth_year <= (EXTRACT(year FROM CURRENT_DATE))::integer))`
        ),
        check(
            "clients_birth_month_check",
            sql`(birth_month IS NULL) OR ((birth_month >= 1) AND (birth_month <= 12))`
        ),
        check(
            "clients_phone_e164_check",
            sql`(phone IS NULL) OR (phone ~ '^\\+[1-9][0-9]{1,14}$'::text)`
        ),
        check(
            "clients_secondary_phone_e164_check",
            sql`(secondary_phone IS NULL) OR (secondary_phone ~ '^\\+[1-9][0-9]{1,14}$'::text)`
        ),
        check(
            "phones_not_same",
            sql`(secondary_phone IS NULL) OR ((secondary_phone)::text <> (phone)::text)`
        ),
    ]
);

export const callLogTypes = pgTable("call_log_types", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: varchar({ length: 50 }).notNull(),
});

export const callLogs = pgTable(
    "call_logs",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        createdByUserId: uuid("created_by_user_id").notNull(),
        date: date().notNull(),
        callType: uuid("call_type").notNull(),
        firstName: varchar("first_name", { length: 255 }).notNull(),
        lastName: varchar("last_name", { length: 255 }).notNull(),
        phoneNumber: text("phone_number").notNull(),
        message: text(),
        notes: text(),
        isDeleted: boolean("is_deleted").default(false),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.createdByUserId],
            foreignColumns: [users.id],
            name: "call_logs_created_by_user_id_fkey",
        }),
        foreignKey({
            columns: [table.callType],
            foreignColumns: [callLogTypes.id],
            name: "call_logs_call_type_fkey",
        }),
        check(
            "call_logs_phone_number_e164_check",
            sql`(phone_number IS NULL) OR (phone_number ~ '^\\+[1-9]\d{1,14}$'::text)`
        ),
    ]
);

export const appointments = pgTable(
    "appointments",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        clientId: uuid("client_id").notNull(),
        driverId: uuid("driver_id"),
        dispatcherId: uuid("dispatcher_id").notNull(),
        createdByUserId: uuid("created_by_user_id").notNull(),
        status: appointmentStatus().default("Unassigned").notNull(),
        startDate: date("start_date").notNull(),
        startTime: time("start_time").notNull(),
        estimatedDurationMinutes: integer("estimated_duration_minutes"),
        pickupLocation: uuid("pickup_location").notNull(),
        destinationLocation: uuid("destination_location").notNull(),
        tripCount: integer("trip_count").default(1).notNull(),
        tripPurpose: text("trip_purpose"),
        notes: text(),
        donationType: donationType("donation_type").default("None").notNull(),
        donationAmount: numeric("donation_amount", { precision: 10, scale: 2 }),
        milesDriven: integer("miles_driven"),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.clientId],
            foreignColumns: [clients.id],
            name: "appointments_client_id_fkey",
        }),
        foreignKey({
            columns: [table.driverId],
            foreignColumns: [users.id],
            name: "appointments_driver_id_fkey",
        }),
        foreignKey({
            columns: [table.dispatcherId],
            foreignColumns: [users.id],
            name: "appointments_dispatcher_id_fkey",
        }),
        foreignKey({
            columns: [table.createdByUserId],
            foreignColumns: [users.id],
            name: "appointments_created_by_user_id_fkey",
        }),
        foreignKey({
            columns: [table.pickupLocation],
            foreignColumns: [locations.id],
            name: "appointments_pickup_location_fkey",
        }),
        foreignKey({
            columns: [table.destinationLocation],
            foreignColumns: [locations.id],
            name: "appointments_destination_location_fkey",
        }),
    ]
);

export const notifications = pgTable("notifications", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id"),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    isDismissed: boolean("is_dismissed").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
        .defaultNow()
        .notNull(),
});

export const messages = pgTable(
    "messages",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        senderId: uuid("sender_id"),
        messageType: messageType("message_type").default("Email").notNull(),
        subject: varchar({ length: 255 }).notNull(),
        body: text().notNull(),
        status: messageStatus().default("pending").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.senderId],
            foreignColumns: [users.id],
            name: "messages_sender_id_fkey",
        }),
    ]
);

export const messageRecipients = pgTable(
    "message_recipients",
    {
        messageId: uuid("message_id").notNull(),
        userId: uuid("user_id").notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.messageId],
            foreignColumns: [messages.id],
            name: "message_recipients_message_id_fkey",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "message_recipients_user_id_fkey",
        }).onDelete("cascade"),
        primaryKey({ columns: [table.messageId, table.userId], name: "message_recipients_pkey" }),
    ]
);

export const rolePermissions = pgTable(
    "role_permissions",
    {
        roleId: uuid("role_id").notNull(),
        permissionId: uuid("permission_id").notNull(),
        grantAccess: boolean("grant_access").default(true).notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.roleId],
            foreignColumns: [roles.id],
            name: "role_permissions_role_id_fkey",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.permissionId],
            foreignColumns: [permissions.id],
            name: "role_permissions_permission_id_fkey",
        }).onDelete("cascade"),
        primaryKey({ columns: [table.roleId, table.permissionId], name: "role_permissions_pkey" }),
    ]
);

export const userPermissions = pgTable(
    "user_permissions",
    {
        permissionId: uuid("permission_id").notNull(),
        userId: uuid("user_id").notNull(),
        grantAccess: boolean("grant_access").default(true).notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.permissionId],
            foreignColumns: [permissions.id],
            name: "user_permissions_permission_id_fkey",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "user_permissions_user_id_fkey",
        }).onDelete("cascade"),
        primaryKey({ columns: [table.permissionId, table.userId], name: "user_permissions_pkey" }),
    ]
);
