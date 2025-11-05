import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as orgSchema from "./org/schema.js";
import { seedAll } from "./seeders/permissions.seeder.js";

async function seedTemplateDatabase() {
    // Loacal .env for running npm scripts outside docker
    // dotenv.config({ path: ".env.local" });
    // console.log("[seed] Using .env.local for database connection");

    const { ORG_DATABASE_URL } = process.env;

    if (!ORG_DATABASE_URL) {
        console.error("[seed] ORG_DATABASE_URL is not set");
        process.exit(1);
    }

    const pool = new Pool({ connectionString: ORG_DATABASE_URL });
    const db = drizzle(pool, { schema: orgSchema });

    try {
        console.log("[seed] Starting template database seeding...");
        console.log(`[seed] Database: ${new URL(ORG_DATABASE_URL).pathname.slice(1)}`);

        await seedAll(db);

        console.log("[seed] Template database seeded successfully!");
    } catch (error) {
        console.error("");
        console.error("[seed] Seeding failed:", error);
        if (error instanceof Error) {
            console.error("[seed] Error details:", error.message);
            console.error("[seed] Stack trace:", error.stack);
        }
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedTemplateDatabase().catch((err) => {
        console.error("[seed] Fatal error:", err);
        process.exit(1);
    });
}

export { seedTemplateDatabase };
