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
import CreateRideForm, { type CreateRideFormValues } from "@/components/forms/createRideForm";

type Props = {
    trigger?: React.ReactNode;
    onSave?: (v: CreateRideFormValues) => Promise<void> | void;
};

export default function CreateRideModal({ trigger, onSave }: Props) {
    const [open, setOpen] = React.useState(false);

    // Provide the form with sane starting values
    const defaultValues: Partial<CreateRideFormValues> = {};

    async function handleSubmit(values: CreateRideFormValues) {
        await onSave?.(values);
        toast.success("Ride created");
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? <Button className="rounded-md">New Ride</Button>}
            </DialogTrigger>
            <DialogContent className="!max-w-[692px] w-[95vw] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>New Ride</DialogTitle>
                </DialogHeader>

                {/* ✅ Pass defaultValues so the prop requirement is satisfied */}
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
