import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import createError from "http-errors";
import logger from "morgan";

// import authRouter from "./routes/auth.js";
import sseRouter from "./routes/sse.js";

// org-scoped
import appointmentsRouter from "./routes/api.org.appointments.js";
import clientsRouter from "./routes/api.org.clients.js";
import locationsRouter from "./routes/api.org.locations.js";
import notificationsRouter from "./routes/api.org.notifications.js";
import reportsRouter from "./routes/api.org.reports.js";
import rolesRouter from "./routes/api.org.roles.js";
import orgSettingsRouter from "./routes/api.org.settings.js";
import usersRouter from "./routes/api.org.users.js";

import orgAuthRouter from "./routes/api.org.auth.js";

// system-scoped
import organizationsRouter from "./routes/api.sys.organizations.js";
import sysSettingsRouter from "./routes/api.sys.settings.js";

import apiRouter from "./routes/api.js";

import { NextFunction, Request, Response } from "express";

import { eq } from "drizzle-orm";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { roles, users } from "./drizzle/org/schema.js";
import { createOrgDbFromTemplate, preloadOrgPools } from "./drizzle/pool-manager.js";
import { getSysDb } from "./drizzle/sys-client.js";
import { withAuth } from "./middleware/with-auth.js";
import { withOrg } from "./middleware/with-org.js";
import { hashPassword } from "./utils/password.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

if (process.env.ENABLE_PGADMIN === "true") {
    const pgadminProxyOptions = createProxyMiddleware({
        target: "http://pgadmin:80",
        changeOrigin: true,
        pathRewrite: (path) => `/s/pgadmin/${path}`,
        cookiePathRewrite: { "/": "/s/pgadmin" },
        logger: console,
        plugins: [
            (proxyServer) => {
                proxyServer.on("proxyReq", (proxyReq, req) => {
                    proxyReq.setHeader("X-Script-Name", "/s/pgadmin");
                    proxyReq.setHeader("X-Forwarded-Proto", "http");
                    if (req.headers.host) proxyReq.setHeader("X-Forwarded-Host", req.headers.host);
                });
            },
        ],
    });

    app.use("/s/pgadmin", pgadminProxyOptions);
}

// CORS configuration
app.use(
    cors({
        origin: [
            "https://braaaaam.webdev.gccis.rit.edu",
            "http://localhost:5173",
            "http://localhost:3000",
        ], //TODO: use .env for allowed origins
        credentials: true,
    })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Preload system and organization database pools on server start
// Note: this only creates the pools once, other calls reuse them.
(async () => {
    getSysDb();
    await preloadOrgPools();
})().catch((e) => {
    console.error("Startup error:", e);
    process.exit(1);
});

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/test/create-org-db", async (req: Request, res: Response) => {
    const {
        subdomain,
        name,
        pocName,
        pocEmail,
        addressLine1,
        addressLine2,
        city,
        state,
        zip,
        country,
    } = req.query;

    if (
        typeof subdomain !== "string" ||
        typeof name !== "string" ||
        typeof pocName !== "string" ||
        typeof pocEmail !== "string" ||
        typeof addressLine1 !== "string" ||
        typeof city !== "string" ||
        typeof state !== "string" ||
        typeof zip !== "string" ||
        typeof country !== "string"
    ) {
        return res.status(400).json({ error: "Missing or invalid required query parameters" });
    }

    try {
        await createOrgDbFromTemplate(
            subdomain,
            name,
            pocName,
            pocEmail,
            addressLine1,
            city,
            state,
            zip,
            country,
            typeof addressLine2 === "string" ? addressLine2 : undefined
        );
        return res.json({ message: `Organization database '${subdomain}' created successfully.` });
    } catch (error) {
        console.error("Error creating organization database:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/test/o/:orgId/users", withOrg, async (req: Request, res: Response) => {
    try {
        const orgUsers = await req.org?.db.select().from(users);
        return res.json({ orgUsers });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Test route to create a user with a specific role
app.get("/test/o/:orgId/create-user", withOrg, async (req: Request, res: Response) => {
    const {
        firstName,
        lastName,
        email,
        password,
        phone,
        roleKey, // Use roleKey instead of roleId for the test route
    } = req.query;

    if (
        typeof firstName !== "string" ||
        typeof lastName !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof phone !== "string"
    ) {
        return res.status(400).json({
            error: "Missing or invalid required query parameters",
            required: "firstName, lastName, email, password, phone",
            optional: "roleKey (defaults to no role)",
        });
    }

    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Hash the password
        const passwordHash = await hashPassword(password);

        // Look up role by roleKey if provided
        let roleId: string | null = null;
        if (typeof roleKey === "string") {
            const [role] = await db.select().from(roles).where(eq(roles.roleKey, roleKey)).limit(1);

            if (!role) {
                return res.status(400).json({
                    error: `Role with key '${roleKey}' not found`,
                    availableRoles: "super-admin, admin, dispatcher, driver, viewer",
                });
            }
            roleId = role.id;
        }

        // Create the user
        const [newUser] = await db
            .insert(users)
            .values({
                firstName,
                lastName,
                email,
                phone,
                passwordHash,
                roleId,
                isActive: true,
                isDriver: false,
                isDeleted: false,
            })
            .returning();

        return res.json({
            message: `User '${email}' created successfully${roleKey ? ` with role '${roleKey}'` : ""}`,
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                roleId: newUser.roleId,
            },
        });
    } catch (error: unknown) {
        console.error("Error creating test user:", error);

        // Check for unique constraint violation
        if (error && typeof error === "object" && "code" in error && error.code === "23505") {
            return res.status(400).json({ error: "User with this email already exists" });
        }

        return res.status(500).json({ error: "Internal server error" });
    }
});

// API routes
app.use("/api", apiRouter);

// Authentication routes
app.use("/auth", withOrg, orgAuthRouter);

// Protected org-scoped routes with authentication
app.use("/o/users", withAuth, withOrg, usersRouter);
app.use("/o/clients", withAuth, withOrg, clientsRouter);
app.use("/o/:orgId/settings", withAuth, withOrg, orgSettingsRouter);
app.use("/o/:orgId/appointments", withAuth, withOrg, appointmentsRouter);
app.use("/o/:orgId/notifications", withAuth, withOrg, notificationsRouter);
app.use("/o/:orgId/reports", withAuth, withOrg, reportsRouter);
app.use("/o/:orgId/settings/roles", withAuth, withOrg, rolesRouter);
app.use("/o/:orgId/settings/locations", withAuth, withOrg, locationsRouter);

// Protected system-scoped routes with authentication
app.use("/s/settings", withAuth, sysSettingsRouter);
app.use("/s/organizations", withAuth, organizationsRouter);

// SSE route
app.use("/sse", sseRouter);

// Catch-all route - serve React app for any non-API routes
app.get("/*", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
    next(createError(404));
});

interface HttpError extends Error {
    status?: number;
    statusCode?: number;
}

// error handler
app.use(function (err: HttpError, req: Request, res: Response, _next: NextFunction) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500).json({
        message: err.message,
        error: req.app.get("env") === "development" ? err : {},
    });
});

export default app;
