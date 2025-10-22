import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./drizzle/org/schema.ts",
    dialect: "postgresql",
    out: "./drizzle/org",

    dbCredentials: {
        url: "postgresql://braaaaam:password@localhost:5432/org",
    },

    introspect: {
        casing: "camel",
    },

    verbose: true,
});
