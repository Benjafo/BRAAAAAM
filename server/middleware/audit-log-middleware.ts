import { RequestHandler } from "express";
import { auditLogs } from "../drizzle/org/schema.js";
import { AuditLogInsert } from "../types/audit-log.types.js";

export const attachAuditLogMiddleware: RequestHandler = (req, _res, next) => {

  req.auditLog = async (entry: AuditLogInsert) => {
    const db = req.org?.db;

    if(!db) {
      console.warn(`Audit log middleware: No DB found, skipping audit log attachment.`);
      return next();
    }
    try {

      await db.insert(auditLogs).values({
        userId: entry.userId ?? req.user?.id ?? null,
        objectId: entry.objectId ?? null,
        objectType: entry.objectType ?? null,
        actionType: entry.actionType,
        actionMessage: entry.actionMessage ?? null,
        actionDetails: entry.actionDetails ?? {},
      });

    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  };

  next();
};