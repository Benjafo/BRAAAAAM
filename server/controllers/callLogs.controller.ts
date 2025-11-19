import { and, eq, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { callLogs, users } from "../drizzle/org/schema.js";
import { applyQueryFilters } from "../utils/queryParams.js";

export const listCallLogs = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        // Define columns for searching, sorting, and filtering
        const callerName = sql<string>`CONCAT(${callLogs.firstName}, ' ', ${callLogs.lastName})`;
        const searchableColumns = [
            callLogs.firstName,
            callLogs.lastName,
            callLogs.phoneNumber,
            callLogs.callType,
            callerName,
        ];
        const sortableColumns: Record<string, any> = {
            callerName,
            date: callLogs.date,
            time: callLogs.time,
            phoneNumber: callLogs.phoneNumber,
            callType: callLogs.callType,
        };
        const filterableColumns: Record<string, any> = {
            ...sortableColumns,
        };

        const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(
            req,
            searchableColumns,
            sortableColumns,
            filterableColumns
        );

        // Add soft delete filter
        const whereWithDeleted = and(where, eq(callLogs.isDeleted, false));

        const [{ total }] = await db
            .select({ total: sql<number>`count(*)` })
            .from(callLogs)
            .leftJoin(users, eq(callLogs.createdByUserId, users.id))
            .where(whereWithDeleted);

        const data = await db
            .select({
                id: callLogs.id,
                date: callLogs.date,
                time: callLogs.time,
                firstName: callLogs.firstName,
                lastName: callLogs.lastName,
                phoneNumber: callLogs.phoneNumber,
                callType: callLogs.callType,
                message: callLogs.message,
                notes: callLogs.notes,
                createdByUserId: callLogs.createdByUserId,
                createdByUserName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
                createdAt: callLogs.createdAt,
                updatedAt: callLogs.updatedAt,
            })
            .from(callLogs)
            .leftJoin(users, eq(callLogs.createdByUserId, users.id))
            .where(whereWithDeleted)
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);

        return res.json({
            data,
            page,
            pageSize,
            total,
        });
    } catch (error) {
        console.error("listCallLogs error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getCallLog = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { id } = req.params;

        const [callLog] = await db
            .select({
                id: callLogs.id,
                date: callLogs.date,
                time: callLogs.time,
                firstName: callLogs.firstName,
                lastName: callLogs.lastName,
                phoneNumber: callLogs.phoneNumber,
                callType: callLogs.callType,
                message: callLogs.message,
                notes: callLogs.notes,
                createdByUserId: callLogs.createdByUserId,
                createdByUserName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
                createdAt: callLogs.createdAt,
                updatedAt: callLogs.updatedAt,
            })
            .from(callLogs)
            .leftJoin(users, eq(callLogs.createdByUserId, users.id))
            .where(and(eq(callLogs.id, id), eq(callLogs.isDeleted, false)));

        if (!callLog) {
            return res.status(404).json({ error: "Call log not found" });
        }

        return res.json(callLog);
    } catch (error) {
        console.error("getCallLog error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const createCallLog = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { date, time, firstName, lastName, phoneNumber, callType, message, notes } = req.body;

        if (!date || !firstName || !lastName || !phoneNumber || !callType) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const [newCallLog] = await db
            .insert(callLogs)
            .values({
                date,
                time: time || null,
                firstName,
                lastName,
                phoneNumber,
                callType,
                message: message || null,
                notes: notes || null,
                createdByUserId: req.user!.id,
            })
            .returning();

        req.auditLog({
            actionType: "callLog.created",
            objectId: newCallLog.id,
            objectType: "callLog",
            actionMessage: `Call Log created by ${req.user?.firstName} ${req.user?.lastName} for ${firstName} ${lastName} with the phone number ${phoneNumber}`,
        });

        return res.status(201).json(newCallLog);
    } catch (error) {
        console.error("createCallLog error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateCallLog = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { id } = req.params;
        const { date, time, firstName, lastName, phoneNumber, callType, message, notes } = req.body;

        const [callLog] = await db
            .select()
            .from(callLogs)
            .where(and(eq(callLogs.id, id), eq(callLogs.isDeleted, false)));

        const [updatedCallLog] = await db
            .update(callLogs)
            .set({
                date,
                time: time || null,
                firstName,
                lastName,
                phoneNumber,
                callType,
                message: message || null,
                notes: notes || null,
                updatedAt: new Date().toISOString(),
            })
            .where(and(eq(callLogs.id, id), eq(callLogs.isDeleted, false)))
            .returning();

        if (!updatedCallLog) {
            return res.status(404).json({ error: "Call log not found" });
        }

        req.auditLog({
            actionType: "callLog.updated",
            objectId: updatedCallLog.id,
            objectType: "callLog",
            actionMessage: `Call Log updated by ${req.user?.firstName} ${req.user?.lastName}`,
            actionDetails: { 
                original: {
                    callLog: callLog,
                },
                updated: {
                    callLog: updatedCallLog,
                }
             },
        });

        return res.json(updatedCallLog);
    } catch (error) {
        console.error("updateCallLog error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteCallLog = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { id } = req.params;

        // Soft delete
        const [deletedCallLog] = await db
            .update(callLogs)
            .set({
                isDeleted: true,
                updatedAt: new Date().toISOString(),
            })
            .where(and(eq(callLogs.id, id), eq(callLogs.isDeleted, false)))
            .returning();

        if (!deletedCallLog) {
            return res.status(404).json({ error: "Call log not found" });
        }

        req.auditLog({
            actionType: "callLog.deleted",
            objectId: deletedCallLog.id,
            objectType: "callLog",
            actionMessage: `Call Log deleted by ${req.user?.firstName} ${req.user?.lastName}`,
            actionDetails: { 
                callLog: deletedCallLog,
             },
        });

        return res.json({ message: "Call log deleted successfully" });
    } catch (error) {
        console.error("deleteCallLog error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
