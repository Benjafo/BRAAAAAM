import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import * as React from "react";
import { toast } from "sonner";
import type { DriverFormValues } from "../form/driverForm";
import DriverForm from "../form/driverForm";

type DriverModalProps = {
    defaultValues?: Partial<DriverFormValues>;
    triggerButton?: React.ReactNode;
};

export default function DriverModal({ defaultValues = {}, triggerButton }: DriverModalProps) {
    const [open, setOpen] = React.useState(false);

    // Determine if we're editing based on whether firstName is populated (AI made this)
    const isEditing = Boolean(defaultValues.firstName);
    const modalTitle = isEditing ? "Edit Driver" : "New Driver";
    const successMessage = isEditing ? "Driver Updated" : "New Driver Created";

    async function handleSubmit(values: DriverFormValues) {
        // TODO: API logic for new/edit driver information
        console.log(values);
        toast.success(successMessage);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton ?? <Button variant="outline">New Driver</Button>}
            </DialogTrigger>
            <DialogContent className="!max-w-[692px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>
                <DriverForm onSubmit={handleSubmit} defaultValues={defaultValues} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="new-driver-form">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
