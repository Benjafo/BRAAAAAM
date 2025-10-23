"use client";
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
import type { LocationFormValues } from "../form/locationForm";
import NewLocationForm from "../form/locationForm";

type NewLocationModalProps = {
    defaultValues?: Partial<LocationFormValues>;
    triggerButton?: React.ReactNode;
};

export default function NewLocationModal({
    defaultValues = {},
    triggerButton,
}: NewLocationModalProps) {
    const [open, setOpen] = React.useState(false);

    // Determine if we're editing based on whether address is populated (AI worked on this)
    const isEditing = defaultValues.locationName !== undefined;
    const modalTitle = isEditing ? "Edit Location" : "New Location";
    const successMessage = isEditing ? "Location Updated" : "New Location Created";

    async function handleSubmit(values: LocationFormValues) {
        // TODO: API logic for new/edit location form values
        console.log(values);
        toast.success(successMessage);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton ?? <Button variant="outline">New Location</Button>}
            </DialogTrigger>
            <DialogContent className="!max-w-[388px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>
                <NewLocationForm onSubmit={handleSubmit} defaultValues={defaultValues} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="new-location-form">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
