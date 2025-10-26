import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import createError from "http-errors";
import logger from "morgan";

import authRouter from "./routes/auth.js";

import dummyRouter from "./routes/dummy.js";

import sseRouter from "./routes/sse.js";

// org-scoped
import appointmentsRouter from "./routes/appointments.js";
import clientsRouter from "./routes/clients.js";
import locationsRouter from "./routes/locations.js";
import notificationsRouter from "./routes/notifications.js";
import orgSettingsRouter from "./routes/org-settings.js";
import reportsRouter from "./routes/reports.js";
import rolesRouter from "./routes/roles.js";
import usersRouter from "./routes/users.js";

// system-scoped
import organizationsRouter from "./routes/organizations.js";
import sysSettingsRouter from "./routes/sys-settings.js";

import { NextFunction, Request, Response } from "express";

import { createProxyMiddleware } from "http-proxy-middleware";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { users } from "./drizzle/org/schema.js";
import { createOrgDbFromTemplate, preloadOrgPools } from "./drizzle/pool-manager.js";
import { getSysDb } from "./drizzle/sys-client.js";
import { withOrg } from "./middleware/with-org.js";
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
    const { subdomain, name, pocEmail } = req.query;

    if (typeof subdomain !== "string" || typeof name !== "string" || typeof pocEmail !== "string") {
        return res.status(400).json({ error: "Missing or invalid query parameters" });
    }

    try {
        await createOrgDbFromTemplate(subdomain, name, pocEmail);
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

// API routes
app.use("/auth", authRouter);
app.use("/dummy", dummyRouter);
app.use("/o/:orgId/users", usersRouter);
app.use("/o/:orgId/clients", clientsRouter);
app.use("/o/:orgId/settings", orgSettingsRouter);
app.use("/s/settings", sysSettingsRouter);
app.use("/o/:orgId/appointments", appointmentsRouter);
app.use("/o/:orgId/notifications", notificationsRouter);
app.use("/o/:orgId/reports", reportsRouter);
app.use("/s/organizations", organizationsRouter);
app.use("/o/:orgId/settings/roles", rolesRouter);
app.use("/o/:orgId/settings/locations", locationsRouter);
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
