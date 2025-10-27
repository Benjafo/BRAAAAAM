"use client";

import OrganizationForm, { type OrganizationFormValues } from "@/components/form/organizationForm";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import ky from "ky";
import { toast } from "sonner";

type OrganizationModalProps = {
    defaultValues?: Partial<OrganizationFormValues> & { id?: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function NewOrganizationModal({ open, onOpenChange }: OrganizationModalProps) {
    // Test default values for now - don't know if we want to use it for anything yet, just using one thing right now to make sure it works
    const defaultValues: Partial<OrganizationFormValues> = {
        status: "Active",
    };

    const isEditing = false; //TODO: fix this
    const successMessage = isEditing ? "Organization Updated" : "New Organization Created";

    // TODO replace with api call
    async function handleSubmit(values: OrganizationFormValues) {
        // Map form values to API structure
        const requestBody = {
            name: values.orgName,
            primaryContact: values.primaryContact,
            phone: `+1${values.phoneGeneral}`,
            email: values.email,
        };

        // Make API call - PUT for edit, POST for create
        if (isEditing) {
            // TODO fix this
            // await ky
            //     .put(`/o/${orgID}/users/${defaultValues.id}`, {
            //         json: requestBody,
            //         headers: {
            //             "x-org-subdomain": orgID,
            //         },
            //     })
            //     .json();
        } else {
            await ky
                .post(`/s/organizations`, {
                    json: requestBody,
                })
                .json();
        }

        toast.success(successMessage);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">New Organization</Button>
            </DialogTrigger>

            <DialogContent className="max-w-[720px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>New Organization</DialogTitle>
                </DialogHeader>

                <OrganizationForm defaultValues={defaultValues} onSubmit={handleSubmit} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="new-organization-form">
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
