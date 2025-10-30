import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
/* eslint-disable */
async function ensureDatabaseExists(databaseUrl: string) {
    const url = new URL(databaseUrl);
    const targetDbName = url.pathname.slice(1); // remove leading '/'

    const adminUrl = new URL(databaseUrl);
    adminUrl.pathname = "/postgres";

    const adminPool = new Pool({ connectionString: adminUrl.toString() });

    try {
        const { rows } = await adminPool.query<{ exists: boolean }>(
            "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
            [targetDbName]
        );

        if (!rows[0]?.exists) {
            const owner = url.username;
            console.log(`[migrate] Database "${targetDbName}" not found. Creating…`);

            await adminPool.query(
                `CREATE DATABASE "${targetDbName}" WITH OWNER "${owner}" ENCODING 'UTF8' TEMPLATE template1`
            );

            console.log(`[migrate] Database "${targetDbName}" created.`);
        } else {
            console.log(`[migrate] Database "${targetDbName}" already exists.`);
        }
    } catch (err: any) {
        // Postgres throws 42P04 (duplicate_database)
        if (err?.code === "42P04") {
            console.log(`[migrate] Database "${targetDbName}" appeared concurrently. Continuing.`);
        } else {
            console.error("[migrate] Failed to ensure database exists:", err);
            throw err;
        }
    } finally {
        await adminPool.end();
    }

    const dbPool = new Pool({ connectionString: databaseUrl });
    try {
        await dbPool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
        await dbPool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        console.log("[migrate] Required extensions installed.");
    } finally {
        await dbPool.end();
    }
}

async function runMigrations() {
    const { SYS_DATABASE_URL, ORG_DATABASE_URL } = process.env;

    if (!SYS_DATABASE_URL || !ORG_DATABASE_URL) {
        console.error("SYS_DATABASE_URL and or ORG_DATABASE_URL is not set");
        process.exit(1);
    }

    await ensureDatabaseExists(SYS_DATABASE_URL);
    await ensureDatabaseExists(ORG_DATABASE_URL);

    const urls = [SYS_DATABASE_URL, ORG_DATABASE_URL];

    for (const url of urls) {
        const pool = new Pool({ connectionString: url });
        try {
            const db = drizzle(pool);
            const dbUrl = new URL(url);
            const targetDbName = dbUrl.pathname.slice(1);
            console.log(`[migrate] Applying migrations to database "${targetDbName}"…`);
            await migrate(db, { migrationsFolder: `drizzle/${targetDbName}` });
        } finally {
            await pool.end();
        }
    }

    console.log("[migrate] All migrations applied.");
}

runMigrations().catch((err) => {
    console.error("[migrate] Fatal error:", err);
    process.exit(1);
});
