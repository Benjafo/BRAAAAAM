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
import type { NewDriverFormValues } from "../form/newDriverForm";
import NewDriverForm from "../form/newDriverForm";

export default function NewDriverModal() {
    const [open, setOpen] = React.useState(false);

    // Test default values for now - don't know if we want to use it for anything yet, just using one thing right now to make sure it works
    const defaultValues: Partial<NewDriverFormValues> = {
        vehicleType: "",
    };
    async function handleSubmit(values: NewDriverFormValues) {
        // TODO: API logic for new client information sent
        console.log(values); // Testing to see if values appear after submit
        toast.success("New Driver Created");
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">New Driver</Button>
            </DialogTrigger>

            <DialogContent className="!max-w-[692px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>New Driver</DialogTitle>
                </DialogHeader>

                <NewDriverForm onSubmit={handleSubmit} defaultValues={defaultValues} />
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
