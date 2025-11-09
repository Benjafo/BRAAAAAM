"use client";
import RecurringUnavailabilityForm, {
    type RecurringUnavailabilityFormValues,
} from "@/components/form/recurringUnavailabilityForm";
import TempUnavailabilityForm, {
    type TempUnavailabilityFormValues,
} from "@/components/form/tempUnavailabilityForm";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { http } from "@/services/auth/serviceResolver";
import * as React from "react";
import { toast } from "sonner";
import { useAuthStore } from "../stores/authStore";
import OverlapWarningModal from "./overlapWarningModal";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab?: "temporary" | "recurring";
    tempInitial?: Partial<TempUnavailabilityFormValues>;
    recurringInitial?: Partial<RecurringUnavailabilityFormValues>;
    onSuccess?: () => void;
};

export default function UnavailabilityModal({
    open,
    onOpenChange,
    defaultTab = "temporary",
    tempInitial,
    recurringInitial,
    onSuccess,
}: Props) {
    const [activeTab, setActiveTab] = React.useState<"temporary" | "recurring">(defaultTab);
    const [overlapConflicts, setOverlapConflicts] = React.useState<any[]>([]);
    const [lastSubmittedValues, setLastSubmittedValues] = React.useState<any>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const userId = useAuthStore((s) => s.user)?.id;
    const orgId = "braaaaam"; // TODO hardcoded

    async function handleTempSubmit(values: TempUnavailabilityFormValues, ignoreOverlap = false) {
        if (!userId) {
            toast.error("User not authenticated, please log in again.");
            return;
        }

        setIsSubmitting(true);
        setLastSubmittedValues({ ...values, type: "temporary" });

        const requestBody = {
            startDate: values.startDate.toISOString().split("T")[0],
            endDate: values.multiDay
                ? values.endDate?.toISOString().split("T")[0]
                : values.startDate.toISOString().split("T")[0],
            startTime: values.allDay ? null : values.startTime,
            endTime: values.allDay ? null : values.endTime,
            isAllDay: values.allDay,
            reason: values.reason || null,
            isRecurring: false,
            recurringDayOfWeek: null,
        };

        try {
            const url = ignoreOverlap
                ? `/api/o/${orgId}/users/${userId}/unavailability?ignoreOverlap=true`
                : `/api/o/${orgId}/users/${userId}/unavailability`;

            const response: Response = await http.post(url, {
                json: requestBody,
                headers: {
                    "x-org-subdomain": orgId,
                },
            });

            // Handle overlap conflict
            if (response.status === 409) {
                const data = await response.json();
                setOverlapConflicts(data.conflicts || []);
                setIsSubmitting(false);
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to create unavailability");
            }

            toast.success("Temporary unavailability created");
            setOpen(false);
            onSuccess?.();
        } catch (err) {
            console.error("Error creating unavailability:", err);
            toast.error("Failed to create unavailability");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleRecurringSubmit(
        values: RecurringUnavailabilityFormValues,
        ignoreOverlap = false
    ) {
        if (!userId) {
            toast.error("User not authenticated");
            return;
        }

        setIsSubmitting(true);
        setLastSubmittedValues({ ...values, type: "recurring" });

        const requestBody = {
            startDate: new Date().toISOString().split("T")[0], // Placeholder date
            endDate: new Date().toISOString().split("T")[0], // Placeholder date
            startTime: values.allDay ? null : values.startTime,
            endTime: values.allDay ? null : values.endTime,
            isAllDay: values.allDay,
            reason: values.reason || null,
            isRecurring: true,
            recurringDayOfWeek: values.day,
        };

        try {
            const url = ignoreOverlap
                ? `/api/o/${orgId}/users/${userId}/unavailability?ignoreOverlap=true`
                : `/api/o/${orgId}/users/${userId}/unavailability`;

            const response: Response = await http
                .post(url, {
                    json: requestBody,
                    headers: {
                        "x-org-subdomain": orgId,
                    },
                })
                .json();

            // Handle overlap conflict
            if (response.status === 409) {
                const data = await response.json();
                setOverlapConflicts(data.conflicts || []);
                setIsSubmitting(false);
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to create unavailability");
            }

            toast.success("Recurring unavailability created");
            setOpen(false);
            onSuccess?.();
        } catch (err) {
            console.error("Error creating unavailability:", err);
            toast.error("Failed to create unavailability");
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleOverlapConfirm() {
        setOverlapConflicts([]);
        if (lastSubmittedValues) {
            if (lastSubmittedValues.type === "temporary") {
                handleTempSubmit(lastSubmittedValues, true);
            } else {
                handleRecurringSubmit(lastSubmittedValues, true);
            }
        }
    }

    function handleOverlapCancel() {
        setOverlapConflicts([]);
    }

    return (
        <>
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
                            disabled={isSubmitting}
                            form={
                                activeTab === "temporary"
                                    ? "temp-unavailability-form"
                                    : "recurring-unavailability-form"
                            }
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <OverlapWarningModal
                open={overlapConflicts.length > 0}
                conflicts={overlapConflicts}
                onConfirm={handleOverlapConfirm}
                onCancel={handleOverlapCancel}
            />
        </>
    );
}
