"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import CreateRideForm, { type CreateRideFormValues } from "@/components/forms/createRideForm";

type Props = {
  trigger?: React.ReactNode;
  onSave?: (v: CreateRideFormValues) => Promise<void> | void;
};

export default function CreateRideModal({ trigger, onSave }: Props) {
  const [open, setOpen] = React.useState(false);

  async function handleSubmit(values: CreateRideFormValues) {
    await onSave?.(values);
    toast.success("Ride created");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button className="rounded-md">New Ride</Button>}</DialogTrigger>
      <DialogContent className="max-w-[720px]">
        <DialogHeader><DialogTitle>New Ride</DialogTitle></DialogHeader>
        <CreateRideForm onSubmit={handleSubmit} submitLabel="Save" />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
