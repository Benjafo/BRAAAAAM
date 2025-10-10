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

type Props = {
    trigger?: React.ReactNode;
    defaultTab?: "temporary" | "recurring";
    tempInitial?: Partial<TempUnavailabilityFormValues>;
    recurringInitial?: Partial<RecurringUnavailabilityFormValues>;
    onSaveTemp?: (v: TempUnavailabilityFormValues) => Promise<void> | void;
    onSaveRecurring?: (v: RecurringUnavailabilityFormValues) => Promise<void> | void;
};

export default function UnavailabilityModal({
    trigger,
    defaultTab = "temporary",
    tempInitial,
    recurringInitial,
    onSaveTemp,
    onSaveRecurring,
}: Props) {
    const [open, setOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<"temporary" | "recurring">(defaultTab);

    async function handleTempSubmit(v: TempUnavailabilityFormValues) {
        await onSaveTemp?.(v);
        setOpen(false);
    }

    async function handleRecurringSubmit(v: RecurringUnavailabilityFormValues) {
        await onSaveRecurring?.(v);
        setOpen(false);
    }

    // Reset to default tab when modal opens. Used AI & ShadCN for the tabs component + combining the two modals together.
    React.useEffect(() => {
        if (open) {
            setActiveTab(defaultTab);
        }
    }, [open, defaultTab]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? <Button variant="outline">Add Unavailability</Button>}
            </DialogTrigger>
            <DialogContent className="!max-w-[388px]">
                <DialogHeader>
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

                <DialogFooter className="flex justify-end gap-2">
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
