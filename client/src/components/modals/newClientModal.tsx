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

export default function NewClientModal() {
    const [open, setOpen] = React.useState(false);

    // Test default values for now - don't know if we want to use it for anything yet, just using one thing right now to make sure it works
    const defaultValues: Partial<NewClientFormValues> = {
        livingAlone: "Lives alone",
    };
    async function handleSubmit(values: NewClientFormValues) {
        // TODO: API logic for new client information sent
        console.log(values); // Testing to see if values appear after submit
        toast.success("New Client Created");
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">New Client</Button>
            </DialogTrigger>

            <DialogContent className="!max-w-[692px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>New Client</DialogTitle>
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
