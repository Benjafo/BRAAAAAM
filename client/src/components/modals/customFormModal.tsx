import CustomFormBuilder, {
    type CustomFormBuilderValues,
} from "@/components/form/customFormBuilder";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: Partial<CustomFormBuilderValues>;
    onSuccess?: () => void;
};

export default function CustomFormModal({ open, onOpenChange, defaultValues, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!(defaultValues as any)?.id;

    async function handleSubmit(values: CustomFormBuilderValues) {
        setIsSubmitting(true);
        try {
            const orgID = "braaaaam"; // TODO fix hardcoded
            
            if (isEditing) {
                await http.put(`o/${orgID}/custom-forms/${(defaultValues as any).id}`, {
                    json: values,
                });
                toast.success("Custom form updated successfully");
            } else {
                await http.post(`o/${orgID}/custom-forms`, {
                    json: values,
                });
                toast.success("Custom form created successfully");
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Failed to save custom form:", error);
            toast.error("Failed to save custom form");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit" : "Create"} Custom Form</DialogTitle>
                </DialogHeader>

                <CustomFormBuilder defaultValues={defaultValues} onSubmit={handleSubmit} />

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" form="custom-form-builder" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Form"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
