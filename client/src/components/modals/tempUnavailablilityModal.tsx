"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import TempUnavailabilityForm, {
    type TempUnavailabilityFormValues,
} from "@/components/forms/tempUnavailabilityForm";

type Props = {
    trigger?: React.ReactNode;
    initial?: Partial<TempUnavailabilityFormValues>;
    onSave?: (v: TempUnavailabilityFormValues) => Promise<void> | void;
};

export default function TempUnavailablilityModal({ trigger, initial, onSave }: Props) {
    const [open, setOpen] = React.useState(false);

    async function handleSubmit(v: TempUnavailabilityFormValues) {
        await onSave?.(v);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? <Button variant="outline">Add Unavailability</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Add a Temporary Unavailability</DialogTitle>
                </DialogHeader>
                <TempUnavailabilityForm defaultValues={initial} onSubmit={handleSubmit} />
                <DialogFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="temp-unavailability-form">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
