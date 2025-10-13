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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TempUnavailabilityForm, {
    type TempUnavailabilityFormValues,
} from "@/components/form/tempUnavailabilityForm";
import RecurringUnavailabilityForm, {
    type RecurringUnavailabilityFormValues,
} from "@/components/form/recurringUnavailabilityForm";
import { toast } from "sonner";

type Props = {
    defaultTab?: "temporary" | "recurring";
    tempInitial?: Partial<TempUnavailabilityFormValues>;
    recurringInitial?: Partial<RecurringUnavailabilityFormValues>;
};

export default function UnavailabilityModal({
    defaultTab = "temporary",
    tempInitial,
    recurringInitial,
}: Props) {
    const [open, setOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<"temporary" | "recurring">(defaultTab);

    async function handleTempSubmit(values: TempUnavailabilityFormValues) {
        // TODO: API logic for handling temp submit
        console.log(values); // Testing to see if values appear after submit
        toast.success("Temporary unavailability submitted");
        setOpen(false);
    }

    async function handleRecurringSubmit(values: RecurringUnavailabilityFormValues) {
        // TODO: API logic for handling recurring submit
        console.log(values); // Testing to see if values appear after submit
        toast.success("Recurring unavailability submitted");
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Add Unavailability</Button>
            </DialogTrigger>
            <DialogContent className="!max-w-[388px]">
                <DialogHeader className="pb-2.5">
                    <DialogTitle>Add Unavailability</DialogTitle>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as "temporary" | "recurring")}
                >
                    <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="temporary">Temporary</TabsTrigger>
                        <TabsTrigger value="recurring">Recurring</TabsTrigger>
                    </TabsList>

                    <TabsContent value="temporary" className="mt-4">
                        <TempUnavailabilityForm
                            defaultValues={tempInitial}
                            onSubmit={handleTempSubmit}
                        />
                    </TabsContent>

                    <TabsContent value="recurring" className="mt-4">
                        <RecurringUnavailabilityForm
                            defaultValues={recurringInitial}
                            onSubmit={handleRecurringSubmit}
                        />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form={
                            activeTab === "temporary"
                                ? "temp-unavailability-form"
                                : "recurring-unavailability-form"
                        }
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
