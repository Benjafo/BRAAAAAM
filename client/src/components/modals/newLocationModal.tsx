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
import type { NewLocationFormValues } from "../form/newLocationForm";
import NewLocationForm from "../form/newLocationForm";

export default function NewLocationModal() {
    const [open, setOpen] = React.useState(false);

    // Test default values for now - don't know if we want to use it for anything yet, just using one thing right now to make sure it works
    const defaultValues: Partial<NewLocationFormValues> = {
        locationName: "",
    };
    async function handleSubmit(values: NewLocationFormValues) {
        // TODO: API logic for new location form values
        console.log(values); // Testing to see if values appear after submit
        toast.success("New Location Created");
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">New Location</Button>
            </DialogTrigger>

            <DialogContent className="!max-w-[388px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>New Location</DialogTitle>
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
