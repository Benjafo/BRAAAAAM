"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AuditLogModalEntry } from "@/types/org/auditlog";

type AuditLogModalProps = {
    auditLogEntry: AuditLogModalEntry | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function AuditLogModal({ auditLogEntry, open, onOpenChange }: AuditLogModalProps) {
    if (!auditLogEntry) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Audit Log Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Timestamp Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground">
                                Date
                            </label>
                            <p className="text-base">{auditLogEntry.date}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground">
                                Time
                            </label>
                            <p className="text-base">{auditLogEntry.time}</p>
                        </div>
                    </div>

                    {/* User Information */}
                    <div>
                        <label className="text-sm font-semibold text-muted-foreground">User</label>
                        <p className="text-base">{auditLogEntry.userName || "System"}</p>
                    </div>

                    {/* Action Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground">
                                Action
                            </label>
                            <p className="text-base">{auditLogEntry.formattedAction}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground">
                                Action Type
                            </label>
                            <p className="text-base font-mono text-sm">
                                {auditLogEntry.actionType}
                            </p>
                        </div>
                    </div>

                    {/* Object Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground">
                                Object Type
                            </label>
                            <p className="text-base">
                                {auditLogEntry.formattedObjectType ||
                                    auditLogEntry.objectType ||
                                    "N/A"}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground">
                                Object ID
                            </label>
                            <p className="text-base font-mono text-sm">
                                {auditLogEntry.objectId || "N/A"}
                            </p>
                        </div>
                    </div>

                    {/* Action Message */}
                    <div>
                        <label className="text-sm font-semibold text-muted-foreground">
                            Action Message
                        </label>
                        <p className="text-base">{auditLogEntry.actionMessage || "No message"}</p>
                    </div>

                    {/* Action Details */}
                    <div>
                        <label className="text-sm font-semibold text-muted-foreground">
                            Action Details
                        </label>
                        <pre className="mt-2 rounded-md bg-muted p-4 text-sm whitespace-pre-wrap break-words">
                            {auditLogEntry.actionDetails}
                        </pre>
                    </div>

                    {/* Entry ID */}
                    <div>
                        <label className="text-sm font-semibold text-muted-foreground">
                            Entry ID
                        </label>
                        <p className="text-base font-mono text-sm">{auditLogEntry.id}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
