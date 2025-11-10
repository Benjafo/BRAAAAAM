"use client";

import OrganizationForm, { type OrganizationFormValues } from "@/components/form/organizationForm";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { http } from "@/services/auth/serviceResolver";
import { toast } from "sonner";

type OrganizationModalProps = {
    defaultValues?: Partial<OrganizationFormValues> & { id?: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function NewOrganizationModal({
    open,
    onOpenChange,
    defaultValues: defaultValuesProp,
}: OrganizationModalProps) {
    // Test default values for now - don't know if we want to use it for anything yet, just using one thing right now to make sure it works
    const defaultValues: Partial<OrganizationFormValues> = {
        status: "Active",
        ...defaultValuesProp,
    };

    const isEditing = !!defaultValuesProp?.id;
    const successMessage = isEditing ? "Organization Updated" : "New Organization Created";

    async function handleSubmit(values: OrganizationFormValues) {
        // Extract subdomain from organization name in camelCase
        const subdomain = values.orgName.toLowerCase().split(" ").join("");

        console.log(`Subdomain generated: ${subdomain}`);

        // Map form values to API structure
        const requestBody = {
            name: values.orgName,
            subdomain: subdomain, //TODO replace with form field?
            pocEmail: values.email,
            pocPhone: values.phoneGeneral ? `+1${values.phoneGeneral}` : null, // Optional
            pocName: values.primaryContact
        };

        // Make API call - PUT for edit, POST for create
        if (isEditing) {
            console.log("Editing");
            await http
                .put(`s/organizations/${defaultValuesProp.id}`, {
                    json: requestBody,
                })
                .json();
        } else {
            console.log("Creating");
            await http
                .post(`s/organizations`, {
                    json: requestBody,
                })
                .json();
        }

        toast.success(successMessage);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
