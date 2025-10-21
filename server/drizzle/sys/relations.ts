import { relations } from "drizzle-orm/relations";
import { users, auditLogs } from "./schema";

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	auditLogs: many(auditLogs),
}));