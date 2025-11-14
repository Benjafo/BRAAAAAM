import { Request, Response } from "express";
import { auditLogs, users } from "../drizzle/org/schema.js";
import { eq } from "drizzle-orm";


export const listAuditLogs = async (req: Request, res: Response) => {
    const db = req.org?.db;
    if (!db) return res.status(400).json({ error: "Organization context not found" });

    /**@TODO Add filtering */

    try {
        const logs = await db
            .select()
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.userId, users.id))
            .orderBy(auditLogs.createdAt);
        return res.status(200).json(logs);
    } catch (err) {
        console.error("Error fetching audit logs:", err);
        return res.status(500).json({ error: "Internal server error" });
    }

}
