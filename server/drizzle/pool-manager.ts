// src/db/poolManager.ts
import { DatabaseError, Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { getSysDb } from "./sys-client.js";
import { organizations } from "./sys/schema.js";
import * as orgSchema from "./org/schema.js";
import { DrizzleQueryError, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

type OrgDb = NodePgDatabase<typeof orgSchema>;
type OrgPoolEntry = { pool: Pool; db: OrgDb };

const orgPools = new Map<string, OrgPoolEntry>();

function orgConnectionString(db: string) {
    const base = process.env.ORG_DATABASE_URL;
    if (!base) throw new Error("Missing ORG_DATABASE_URL");

    const url = new URL(base);

    url.pathname = `/${encodeURIComponent(db)}`;
    return url.toString();
}

export function getOrCreateOrgDb(subdomain: string): OrgDb {
    const existing = orgPools.get(subdomain);
    if (existing) return existing.db;

    const connectionString = orgConnectionString(subdomain);
    const pool = new Pool({
        connectionString,
    });

    const db = drizzle(pool, { schema: orgSchema });
    orgPools.set(subdomain, { pool, db });
    return db;
}

// Preloads all org pools on server start. Should only be called once.
export async function preloadOrgPools() {
    const sysDb = getSysDb();
    const rows = await sysDb.select().from(organizations);
    rows.forEach((row) => {
        const key = row.subdomain;
        if (!orgPools.has(key)) {
            getOrCreateOrgDb(key);
        }
    });
}

export async function createOrgDbFromTemplate(
    subdomain: string,
    name: string,
    pocName: string,
    pocEmail: string,
    addressLine1: string,
    city: string,
    state: string,
    zip: string,
    country: string,
    addressLine2?: string,
    pocPhone?: string
) {
    const organizationInsertSchema = createInsertSchema(organizations);
    const parsed = organizationInsertSchema.parse({
        subdomain,
        name,
        pocName,
        pocEmail,
        pocPhone,
        addressLine1,
        addressLine2,
        city,
        state,
        zip,
        country,
    });

    const base = process.env.ORG_DATABASE_URL;
    if (!base) throw new Error("Missing ORG_DATABASE_URL");
    const url = new URL(base);
    const template = url.pathname.slice(1); // remove leading '/'

    const sysDb = getSysDb();

    await sysDb.execute(sql`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = ${template} AND pid <> pg_backend_pid();
    `);

    try {
        await sysDb.execute(sql.raw(`CREATE DATABASE "${subdomain}" WITH TEMPLATE "${template}";`));
    } catch (error) {
        if (error instanceof DrizzleQueryError && error.cause instanceof DatabaseError) {
            if (!(error.cause.code === "42P04" || /already exists/i.test(String(error?.message))))
                throw error;
        }
    }

    await sysDb.insert(organizations).values(parsed).onConflictDoNothing();

    return getOrCreateOrgDb(subdomain);
}

/** Close all org pools (for graceful shutdown) */
export async function closeAllOrgPools() {
    await Promise.all([...orgPools.values()].map((v) => v.pool.end()));
    orgPools.clear();
}
