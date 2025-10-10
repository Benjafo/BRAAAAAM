"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import NewOrganizationForm, {
    type NewOrganizationFormValues,
} from "@/components/form/newOrganizationForm";

export default function NewOrganizationModal() {
    const [open, setOpen] = React.useState(false);

    async function handleSubmit(values: NewOrganizationFormValues) {
        console.log("Submitted organization:", values);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">New Organization</Button>
            </DialogTrigger>

            <DialogContent className="max-w-[720px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader>
                    <DialogTitle>New Organization</DialogTitle>
                </DialogHeader>

                <NewOrganizationForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
