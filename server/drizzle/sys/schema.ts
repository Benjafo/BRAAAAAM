import { sql } from "drizzle-orm";
import {
    boolean,
    check,
    date,
    foreignKey,
    index,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    unique,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

export const auditAction = pgEnum("audit_action", ["auth", "add", "change", "delete", "error"]);

export const organizations = pgTable(
    "organizations",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        name: varchar({ length: 255 }).notNull(),
        subdomain: varchar({ length: 15 }).notNull(),
        logoPath: varchar("logo_path", { length: 255 }),
        phone: text(),
        email: varchar({ length: 255 }),
        addressLine1: varchar("address_line_1", { length: 255 }).notNull(),
        addressLine2: varchar("address_line_2", { length: 255 }),
        city: varchar({ length: 100 }).notNull(),
        state: varchar({ length: 50 }).notNull(),
        zip: varchar({ length: 20 }).notNull(),
        country: varchar({ length: 100 }).notNull(),
        addressValidated: boolean("address_validated").default(false),
        establishedDate: date(),
        pocName: varchar("poc_name", { length: 255 }).notNull(),
        pocEmail: varchar("poc_email", { length: 255 }).notNull(),
        pocPhone: text("poc_phone"),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
        isActive: boolean("is_active").default(true),
    },
    (table) => [
        index("idx_organizations_active_true")
            .using("btree", table.id.asc().nullsLast().op("uuid_ops"))
            .where(sql`is_active`),
        unique("organizations_subdomain_key").on(table.subdomain),
        check(
            "organizations_subdomain_check",
            sql`(subdomain)::text ~ '^[a-z0-9]([a-z0-9-]{0,13}[a-z0-9])?$'::text`
        ),
        check(
            "organizations_poc_phone_check",
            sql`(poc_phone IS NULL) OR (poc_phone ~ '^\\+[1-9][0-9]{1,14}$'::text)`
        ),
        check(
            "organizations_org_phone_check",
            sql`(phone IS NULL) OR (phone ~ '^\\+[1-9][0-9]{1,14}$'::text)`
        ),
    ]
);

export const users = pgTable(
    "users",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        firstName: varchar("first_name", { length: 100 }).notNull(),
        lastName: varchar("last_name", { length: 100 }).notNull(),
        email: varchar({ length: 255 }).notNull(),
        phone: text().notNull(),
        passwordHash: varchar("password_hash", { length: 255 }),
        isActive: boolean("is_active").default(true),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_users_created_at").using(
            "btree",
            table.createdAt.asc().nullsLast().op("timestamptz_ops")
        ),
        unique("users_email_key").on(table.email),
        unique("users_phone_key").on(table.phone),
        check("users_phone_check", sql`phone ~ '^\\+[1-9][0-9]{1,14}$'::text`),
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
        index("idx_audit_action_type").using(
            "btree",
            table.actionType.asc().nullsLast().op("enum_ops")
        ),
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
