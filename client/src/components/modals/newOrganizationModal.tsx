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
import NewOrganizationForm, {
    type NewOrganizationFormValues,
} from "@/components/form/newOrganizationForm";
import { toast } from "sonner";

export default function NewOrganizationModal() {
    const [open, setOpen] = React.useState(false);

    // Test default values for now - don't know if we want to use it for anything yet, just using one thing right now to make sure it works
    const defaultValues: Partial<NewOrganizationFormValues> = {
        status: "Active",
    };
    async function handleSubmit() {
        // TODO: API logic for new organization information sent
        toast.success("New Organization Created");
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">New Organization</Button>
            </DialogTrigger>

            <DialogContent className="max-w-[720px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>New Organization</DialogTitle>
                </DialogHeader>

                <NewOrganizationForm defaultValues={defaultValues} onSubmit={handleSubmit} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="new-organization-form">
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
