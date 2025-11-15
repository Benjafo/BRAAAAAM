export type AuditLogInsert = {
  userId?: string | null;
  objectId?: string | null;
  objectType?: string | null;
  actionType: string;
  actionMessage?: string | null;
  actionDetails?: Record<string, any>;
};