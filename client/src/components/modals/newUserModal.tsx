"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { NewUserFormValues } from "../form/newUserForm";
import NewUserForm from "../form/newUserForm";

type NewUserModalProps = {
    defaultValues?: Partial<NewUserFormValues>;
    triggerButton?: React.ReactNode;
};

export default function NewUserModal({ defaultValues = {}, triggerButton }: NewUserModalProps) {
    const [open, setOpen] = React.useState(false);

    // Determine if we're editing based on whether address is populated (AI worked on this)
    const isEditing = Boolean(defaultValues.locationName);
    const modalTitle = isEditing ? "Edit User" : "New User";
    const successMessage = isEditing ? "User Updated" : "New User Created";

    async function handleSubmit(values: NewUserFormValues) {
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
                <NewUserForm onSubmit={handleSubmit} defaultValues={defaultValues} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="new-user-form">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
