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
import customFormsRouter from "./routes/api.org.custom-forms.js";
import locationsRouter from "./routes/api.org.locations.js";
import notificationsRouter from "./routes/api.org.notifications.js";
import reportsRouter from "./routes/api.org.reports.js";
import rolesRouter from "./routes/api.org.roles.js";
import orgSettingsRouter from "./routes/api.org.settings.js";
import usersRouter from "./routes/api.org.users.js";
import volunteerRecordsRouter from "./routes/api.org.volunteer-records.js";

// import orgAuthRouter from "./routes/api.org.auth.js";

// system-scoped
import organizationsRouter from "./routes/api.sys.organizations.js";
import sysSettingsRouter from "./routes/api.sys.settings.js";

import apiRouter from "./routes/api.js";

import { NextFunction, Request, Response } from "express";

import { eq, sql } from "drizzle-orm";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clients, locations, roles, users } from "./drizzle/org/schema.js";
import { createOrgDbFromTemplate, preloadOrgPools } from "./drizzle/pool-manager.js";
import { getSysDb } from "./drizzle/sys-client.js";
import { withAuth } from "./middleware/with-auth.js";
import { withOrg } from "./middleware/with-org.js";
import { hashPassword } from "./utils/password.js";
import { withAuthRouting } from "./middleware/with-auth-routing.js";
import { initializeEmailTransporter } from "./utils/email.js";

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
    initializeEmailTransporter();
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
        birthYear,
        birthMonth,
        addressLine1,
        addressLine2,
        city,
        state,
        zip,
        country,
    } = req.query;

    if (
        typeof firstName !== "string" ||
        typeof lastName !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof phone !== "string" ||
        typeof birthYear !== "string" ||
        typeof addressLine1 !== "string" ||
        typeof city !== "string" ||
        typeof state !== "string" ||
        typeof zip !== "string" ||
        typeof country !== "string"
    ) {
        return res.status(400).json({
            error: "Missing or invalid required query parameters",
            required: "firstName, lastName, email, password, phone, birthYear, addressLine1, city, state, zip, country",
            optional: "roleKey, birthMonth, addressLine2",
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

        // Create or find location
        const [location] = await db
            .insert(locations)
            .values({
                addressLine1,
                addressLine2: typeof addressLine2 === "string" ? addressLine2 : undefined,
                city,
                state,
                zip,
                country,
            })
            .onConflictDoNothing()
            .returning();

        let locationId: string;
        if (location) {
            locationId = location.id;
        } else {
            // Location already exists, fetch it
            const [existingLocation] = await db
                .select()
                .from(locations)
                .where(
                    sql`lower(${locations.addressLine1}) = lower(${addressLine1})
                    AND COALESCE(lower(${locations.addressLine2}), '') = COALESCE(lower(${addressLine2 || ""}), '')
                    AND lower(${locations.city}) = lower(${city})
                    AND lower(${locations.state}) = lower(${state})
                    AND lower(${locations.zip}) = lower(${zip})
                    AND lower(${locations.country}) = lower(${country})`
                )
                .limit(1);
            locationId = existingLocation.id;
        }

        // Parse birth year and month
        const birthYearInt = parseInt(birthYear, 10);
        const birthMonthInt = typeof birthMonth === "string" ? parseInt(birthMonth, 10) : undefined;

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
                birthYear: birthYearInt,
                birthMonth: birthMonthInt,
                addressLocation: locationId,
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
                birthYear: newUser.birthYear,
                birthMonth: newUser.birthMonth,
                addressLocation: newUser.addressLocation,
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

// Test route to create a client
app.get("/test/o/:orgId/create-client", withOrg, async (req: Request, res: Response) => {
    const {
        firstName,
        lastName,
        phone,
        gender,
        livesAlone,
        birthYear,
        birthMonth,
        addressLine1,
        addressLine2,
        city,
        state,
        zip,
        country,
        email,
        phoneIsCell,
        secondaryPhone,
        secondaryPhoneIsCell,
        contactPreference,
        allowMessages,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
        notes,
        pickupInstructions,
    } = req.query;

    if (
        typeof firstName !== "string" ||
        typeof lastName !== "string" ||
        typeof phone !== "string" ||
        typeof gender !== "string" ||
        typeof livesAlone !== "string" ||
        typeof birthYear !== "string" ||
        typeof addressLine1 !== "string" ||
        typeof city !== "string" ||
        typeof state !== "string" ||
        typeof zip !== "string" ||
        typeof country !== "string"
    ) {
        return res.status(400).json({
            error: "Missing or invalid required query parameters",
            required: "firstName, lastName, phone, gender (Male/Female/Other), livesAlone (true/false), birthYear, addressLine1, city, state, zip, country",
            optional: "birthMonth, addressLine2, email, phoneIsCell, secondaryPhone, secondaryPhoneIsCell, contactPreference, allowMessages, emergencyContactName, emergencyContactPhone, emergencyContactRelationship, notes, pickupInstructions",
        });
    }

    // Validate gender
    if (!["Male", "Female", "Other"].includes(gender)) {
        return res.status(400).json({
            error: "Invalid gender value",
            validValues: "Male, Female, Other",
        });
    }

    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Create or find location
        const [location] = await db
            .insert(locations)
            .values({
                addressLine1,
                addressLine2: typeof addressLine2 === "string" ? addressLine2 : undefined,
                city,
                state,
                zip,
                country,
            })
            .onConflictDoNothing()
            .returning();

        let locationId: string;
        if (location) {
            locationId = location.id;
        } else {
            // Location already exists, fetch it
            const [existingLocation] = await db
                .select()
                .from(locations)
                .where(
                    sql`lower(${locations.addressLine1}) = lower(${addressLine1})
                    AND COALESCE(lower(${locations.addressLine2}), '') = COALESCE(lower(${addressLine2 || ""}), '')
                    AND lower(${locations.city}) = lower(${city})
                    AND lower(${locations.state}) = lower(${state})
                    AND lower(${locations.zip}) = lower(${zip})
                    AND lower(${locations.country}) = lower(${country})`
                )
                .limit(1);
            locationId = existingLocation.id;
        }

        // Parse birth year and month
        const birthYearInt = parseInt(birthYear, 10);
        const birthMonthInt = typeof birthMonth === "string" ? parseInt(birthMonth, 10) : undefined;

        // Parse boolean values
        const livesAloneBool = livesAlone === "true";
        const phoneIsCellBool = phoneIsCell === "true";
        const secondaryPhoneIsCellBool = secondaryPhoneIsCell === "true";
        const allowMessagesBool = allowMessages === "true";

        // Create the client
        const [newClient] = await db
            .insert(clients)
            .values({
                firstName,
                lastName,
                phone,
                gender: gender as "Male" | "Female" | "Other",
                livesAlone: livesAloneBool,
                birthYear: birthYearInt,
                birthMonth: birthMonthInt,
                addressLocation: locationId,
                email: typeof email === "string" ? email : undefined,
                phoneIsCell: phoneIsCellBool,
                secondaryPhone: typeof secondaryPhone === "string" ? secondaryPhone : undefined,
                secondaryPhoneIsCell: secondaryPhoneIsCellBool,
                contactPreference: typeof contactPreference === "string" ? (contactPreference as "email" | "phone") : "phone",
                allowMessages: allowMessagesBool,
                emergencyContactName: typeof emergencyContactName === "string" ? emergencyContactName : undefined,
                emergencyContactPhone: typeof emergencyContactPhone === "string" ? emergencyContactPhone : undefined,
                emergencyContactRelationship: typeof emergencyContactRelationship === "string" ? emergencyContactRelationship : undefined,
                notes: typeof notes === "string" ? notes : undefined,
                pickupInstructions: typeof pickupInstructions === "string" ? pickupInstructions : undefined,
                isActive: true,
            })
            .returning();

        return res.json({
            message: `Client '${firstName} ${lastName}' created successfully`,
            client: {
                id: newClient.id,
                firstName: newClient.firstName,
                lastName: newClient.lastName,
                email: newClient.email,
                phone: newClient.phone,
                birthYear: newClient.birthYear,
                birthMonth: newClient.birthMonth,
                addressLocation: newClient.addressLocation,
            },
        });
    } catch (error: unknown) {
        console.error("Error creating test client:", error);

        // Check for unique constraint violation
        if (error && typeof error === "object" && "code" in error && error.code === "23505") {
            return res.status(400).json({ error: "Client with this phone or email already exists" });
        }

        return res.status(500).json({ error: "Internal server error" });
    }
});

// API routes
app.use("/api", apiRouter);

// Authentication routes
app.use("/auth", withAuthRouting);

// Protected org-scoped routes with authentication
app.use("/o/users", withAuth, withOrg, usersRouter);
app.use("/o/clients", withAuth, withOrg, clientsRouter);
app.use("/o/settings", withAuth, withOrg, orgSettingsRouter);
app.use("/o/appointments", withAuth, withOrg, appointmentsRouter);
app.use("/o/notifications", withAuth, withOrg, notificationsRouter);
app.use("/o/reports", withAuth, withOrg, reportsRouter);
app.use("/o/settings/roles", withAuth, withOrg, rolesRouter);
app.use("/o/settings/locations", withAuth, withOrg, locationsRouter);
app.use("/o/custom-forms", withAuth, withOrg, customFormsRouter);
app.use("/o/volunteer-records", withAuth, withOrg, volunteerRecordsRouter);

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
