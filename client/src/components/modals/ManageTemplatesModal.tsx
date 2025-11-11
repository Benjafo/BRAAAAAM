import { type ReportTemplate } from "@/lib/reportTemplates";
import { http } from "@/services/auth/serviceResolver";
import { Trash, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

interface ManageTemplatesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManageTemplatesModal({ open, onOpenChange }: ManageTemplatesModalProps) {
    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (open) {
            fetchTemplates();
        }
    }, [open]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const data = await http
                .get(`o/reports/templates`)
                .json<{ templates: ReportTemplate[] }>();

            setTemplates(data.templates);
        } catch (err) {
            console.error("Error fetching templates:", err);
            toast.error("Failed to load templates");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (templateId: string) => {
        setIsDeleting(true);

        try {
            const res = await http.delete(`o/reports/templates/${templateId}`);

            // TODO need to check if response is ok
            console.log("Delete response:", res);

            setTemplates(templates.filter((t) => t.id !== templateId));
            setDeleteConfirmId(null);
            toast.success("Template deleted");
        } catch (err) {
            console.error("Error deleting template:", err);
            toast.error("Failed to delete template");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Manage Report Templates</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {isLoading ? (
                            <p className="text-center text-gray-500 py-8">Loading templates...</p>
                        ) : templates.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No templates saved yet</p>
                        ) : (
                            templates.map((template) => (
                                <div key={template.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold">{template.name}</h4>
                                                {template.isShared && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                        <Users className="w-3 h-3" />
                                                        Shared
                                                    </span>
                                                )}
                                            </div>
                                            {template.description && (
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {template.description}
                                                </p>
                                            )}
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                <span>Entity: {template.entityType}</span>
                                                <span>
                                                    {template.selectedColumns.length} columns
                                                </span>
                                                <span>
                                                    Created{" "}
                                                    {new Date(
                                                        template.createdAt
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => setDeleteConfirmId(template.id)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={deleteConfirmId !== null}
                onOpenChange={(open) => !open && setDeleteConfirmId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this report
                            template.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
