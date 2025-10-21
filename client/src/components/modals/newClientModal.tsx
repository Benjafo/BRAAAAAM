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
import type { NewClientFormValues } from "../form/newClientForm";
import { toast } from "sonner";
import NewClientForm from "../form/newClientForm";

type NewClientModalProps = {
    defaultValues?: Partial<NewClientFormValues>;
    triggerButton?: React.ReactNode;
};
export default function NewClientModal({ defaultValues = {}, triggerButton }: NewClientModalProps) {
    const [open, setOpen] = React.useState(false);

    // Determine if we're editing based on whether firstName is populated (AI made this)
    const isEditing = Boolean(defaultValues.firstName);
    const modalTitle = isEditing ? "Edit Client" : "New Client";
    const successMessage = isEditing ? "Client Updated" : "New Client Created";

    async function handleSubmit(values: NewClientFormValues) {
        // TODO: API logic for new client information sent
        console.log(values); // Testing to see if values appear after submit
        toast.success(successMessage);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton ?? <Button variant="outline">New Client</Button>}
            </DialogTrigger>

            <DialogContent className="!max-w-[692px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>

                <NewClientForm onSubmit={handleSubmit} defaultValues={defaultValues} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="new-client-form">
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
