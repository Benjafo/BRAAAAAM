"use client";

import OrganizationForm, { type OrganizationFormValues, type OrganizationValues } from "@/components/form/organizationForm";
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
    defaultValues?: Partial<OrganizationValues>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function NewOrganizationModal({
    open,
    onOpenChange,
    defaultValues,
}: OrganizationModalProps) {
    // Test default values for now - don't know if we want to use it for anything yet, just using one thing right now to make sure it works
    // const defaultValues: Partial<OrganizationValues> = {
    //     // status: "Active",
    //     ...defaultValuesProp,
    // };

    const isEditing = !!defaultValues?.id;
    const successMessage = isEditing ? "Organization Updated" : "New Organization Created";

    async function handleSubmit(values: OrganizationFormValues) {

        console.log('ran')

        // Generate a subdomain: collapse whitespace to a single hyphen, strip invalid chars, and limit to 15 chars
        let subdomain = values.name
            .toLowerCase()
            .trim()
            .replaceAll(/\s+/g, '-')        // collapse any sequence of whitespace into a single hyphen
            .replaceAll(/[^a-z0-9-]/g, '')  // remove characters that are not lowercase letters, digits or hyphen
            .replaceAll(/-+/g, '-');        // collapse multiple hyphens

        // Trim to 15 characters and remove any leading/trailing hyphens that might result from slicing
        subdomain = subdomain.slice(0, 15).replaceAll(/^-+|-+$/g, '');

        console.log(`Subdomain generated: ${subdomain}`);
        console.log("Form Values Submitted: ", values);
        
        // onOpenChange(false);
        // return;
        // Map form values to API structure
        // const requestBody = {
        //     name: values.name,
        //     subdomain: subdomain, //TODO replace with form field?
        //     pocEmail: values.email,
        //     pocPhone: values.pocPhone ? `+1${values.pocPhone}` : null, // Optional
        //     pocName: values.pocName
        // };

        // Make API call - PUT for edit, POST for create
        if (isEditing) {
            console.log("Editing");
            await http
                .put(`s/organizations/${defaultValues?.id}`, {
                    json: {
                        ...values,
                    },
                })
                .json();
        } else {
            console.log("Creating");
            await http
                .post(`s/organizations`, {
                    json: {
                        ...values,
                        subdomain: subdomain,
                    }
                })
                .json();
        }

        toast.success(successMessage);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="lg:max-w-xl max-h-7/8 overflow-y-auto scroll-smooth p-6">
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
