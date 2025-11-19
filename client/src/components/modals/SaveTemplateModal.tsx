import { type ColumnDefinition } from "@/lib/reportColumns";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface SaveTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityType: "clients" | "users" | "appointments" | "volunteerRecords" | "callLogs";
    selectedColumns: ColumnDefinition[];
    onTemplateSaved?: () => void;
}

export function SaveTemplateModal({
    open,
    onOpenChange,
    entityType,
    selectedColumns,
    onTemplateSaved,
}: SaveTemplateModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isShared, setIsShared] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Template name is required");
            return;
        }

        if (selectedColumns.length === 0) {
            toast.error("Please select at least one column");
            return;
        }

        setIsSaving(true);

        const columnKeys = selectedColumns.map((col) => col.key);
        const json = JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            entityType,
            selectedColumns: columnKeys,
            isShared,
        });

        try {
            await http.post(`o/reports/templates`, {
                body: json,
            });

            toast.success("Template saved successfully");
            onOpenChange(false);

            // Reset form
            setName("");
            setDescription("");
            setIsShared(false);

            // Notify parent
            if (onTemplateSaved) {
                onTemplateSaved();
            }
        } catch (err: any) {
            console.error("Error saving template:", err);

            if (err.response?.status === 409) {
                toast.error("A template with this name already exists");
            } else {
                toast.error("Failed to save template");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save Report Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name *</Label>
                        <Input
                            id="template-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Monthly Client Report"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="template-description">Description</Label>
                        <Input
                            id="template-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="share-template"
                            checked={isShared}
                            onCheckedChange={(checked) => setIsShared(checked as boolean)}
                        />
                        <Label htmlFor="share-template" className="cursor-pointer">
                            Share with organization
                        </Label>
                    </div>
                    <p className="text-xs text-gray-500">
                        Saving {selectedColumns.length} selected columns for {entityType}
                    </p>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
                        {isSaving ? "Saving..." : "Save Template"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
