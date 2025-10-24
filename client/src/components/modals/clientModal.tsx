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
import type { ClientFormValues } from "../form/clientForm";
import ClientForm from "../form/clientForm";

type NewClientModalProps = {
    defaultValues?: Partial<ClientFormValues>;
    triggerButton?: React.ReactNode;
};
export default function ClientModal({ defaultValues = {}, triggerButton }: NewClientModalProps) {
    const [open, setOpen] = React.useState(false);

    // Determine if we're editing based on whether firstName is populated (AI made this)
    const isEditing = Boolean(defaultValues.firstName);
    const modalTitle = isEditing ? "Edit Client" : "New Client";
    const successMessage = isEditing ? "Client Updated" : "New Client Created";

    async function handleSubmit(values: ClientFormValues) {
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

                <ClientForm onSubmit={handleSubmit} defaultValues={defaultValues} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="new-client-form">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
