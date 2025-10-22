import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './drizzle/sys/schema.ts',
    dialect: 'postgresql',
    out: './drizzle/sys',

    dbCredentials: {
        url: 'postgresql://braaaaam:password@localhost:5432/sys'
    },

    introspect: {
        casing: 'camel'
    },

    verbose: true,
});