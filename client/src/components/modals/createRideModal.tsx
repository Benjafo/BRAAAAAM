"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import CreateRideForm, { type CreateRideFormValues } from "@/components/form/createRideForm";

export default function CreateRideModal() {
    const [open, setOpen] = React.useState(false);

    // Provide the form, passing in one default value for now to make sure this works
    const defaultValues: Partial<CreateRideFormValues> = {
        additionalRider: "No",
    };

    //
    async function handleSubmit() {
        // TODO: API logic for sending values
        toast.success("Ride Created/Altered");
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">New Ride</Button>
            </DialogTrigger>
            <DialogContent className="!max-w-[692px] w-[95vw] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>Ride Form</DialogTitle>
                </DialogHeader>
                <CreateRideForm defaultValues={defaultValues} onSubmit={handleSubmit} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="create-ride-form">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
