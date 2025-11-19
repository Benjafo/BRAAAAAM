import { Request, Response } from "express";
import { auditLogs, users } from "../drizzle/org/schema.js";
import { eq, sql } from "drizzle-orm";
import { applyQueryFilters } from "../utils/queryParams.js";


export const listAuditLogs = async (req: Request, res: Response) => {
    const db = req.org?.db;
    if (!db) return res.status(400).json({ error: "Organization context not found" });

    /**@TODO Add filtering */
    const userName = sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`;
    const auditLogDate = sql<string>`${auditLogs.createdAt}::date`;
    const auditLogTime = sql<string>`${auditLogs.createdAt}::time`;
    const searchableColumns = [
        auditLogs.createdAt,
        auditLogs.actionType,
        auditLogs.actionMessage,
        auditLogs.objectType,
        auditLogs.objectId,
        users.firstName,
        users.lastName,
    ];
    const sortableColumns: Record<string, any> = {
        userName: userName,
        date: auditLogDate,
        time: auditLogTime,
        formattedAction: auditLogs.actionType,
        formattedObjectType: auditLogs.objectType,
    };
    const filterableColumns: Record<string, any> = {
        ...sortableColumns,
    };

    const { where, orderBy, limit, offset } = applyQueryFilters(
        req,
        searchableColumns,
        sortableColumns,
        filterableColumns
    );

    // Add soft delete filter
    // const whereParams = and(where, eq(callLogs.isDeleted, false));

    try {
        const logs = await db
            .select()
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.userId, users.id))
            .where(where)
            .orderBy(...(orderBy.length > 0 ? orderBy : []))
            .limit(limit)
            .offset(offset);
        // return res.status(200).json(logs);

        const [{total}] = await db
            .select({ total: sql<number>`count(*)` })
            .from(auditLogs);

        return res.status(200).json({
            total: Number(total),
            results: logs,
        });
    } catch (err) {
        console.error("Error fetching audit logs:", err);
        return res.status(500).json({ error: "Internal server error" });
    }

}
