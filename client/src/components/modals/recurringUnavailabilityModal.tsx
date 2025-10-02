"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import RecurringUnavailabilityForm, { type RecurringUnavailabilityFormValues } from "@/components/forms/recurringUnavailabilityForm";

type Props = {
  trigger?: React.ReactNode;
  initial?: Partial<RecurringUnavailabilityFormValues>;
  onSave?: (v: RecurringUnavailabilityFormValues) => Promise<void> | void;
};

export default function RecurringUnavailabilityModal({ trigger, initial, onSave }: Props) {
  const [open, setOpen] = React.useState(false);

  async function handleSubmit(v: RecurringUnavailabilityFormValues) {
    await onSave?.(v);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="outline">Recurring Unavailability</Button>}</DialogTrigger>
      <DialogContent className="max-w-[560px]">
        <DialogHeader><DialogTitle>Schedule Unavailability</DialogTitle></DialogHeader>
        <RecurringUnavailabilityForm defaultValues={initial} onSubmit={handleSubmit} />
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
