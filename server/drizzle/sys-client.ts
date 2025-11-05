import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./sys/schema.js";

let _pool: Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;

export function getSysDb() {
    if (_db) return _db;

    const connectionString = process.env.SYS_DATABASE_URL;
    if (!connectionString) {
        throw new Error("Missing SYS_DATABASE_URL");
    }

    _pool = new Pool({ connectionString });

    _db = drizzle(_pool, { schema });
    return _db;
}

export async function closeSysPool() {
    if (_pool) await _pool.end();
}
