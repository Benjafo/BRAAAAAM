"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Permission } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

/* ----------------------------- Zod schema ----------------------------- */
const roleSchema = z.object({
    roleName: z.string().min(1, "Role name is required").max(255, "Max characters allowed is 255"),
    description: z
        .string()
        .min(1, "Description is required")
        .max(500, "Max characters allowed is 500"),
    isDriverRole: z.boolean(),
    permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
});

export type RoleFormValues = z.infer<typeof roleSchema>;

/* ----------------------------- Props ----------------------------- */
interface RoleFormProps {
    defaultValues?: Partial<RoleFormValues> & { id?: string };
    onSubmit: (values: RoleFormValues) => Promise<void>;
    availablePermissions: Permission[];
}

/* ----------------------------- Helper Functions ----------------------------- */
function groupPermissionsByResource(permissions: Permission[]): Record<string, Permission[]> {
    return permissions.reduce(
        (acc, permission) => {
            if (!acc[permission.resource]) {
                acc[permission.resource] = [];
            }
            acc[permission.resource].push(permission);
            return acc;
        },
        {} as Record<string, Permission[]>
    );
}

function capitalizeResource(resource: string): string {
    // Convert resource names like "users" to "User Management"
    const resourceMap: Record<string, string> = {
        users: "User Management",
        clients: "Client Management",
        appointments: "Appointments",
        appointmentsall: "All Appointments",
        reports: "Reports",
        roles: "Roles",
        permissions: "Permissions",
        settings: "Settings",
        organizations: "Organizations",
        dashboard: "Dashboard",
    };
    return resourceMap[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);
}

/* ----------------------------- Component ----------------------------- */
export default function RoleForm({ defaultValues, onSubmit, availablePermissions }: RoleFormProps) {
    const form = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            roleName: defaultValues?.roleName || "",
            description: defaultValues?.description || "",
            isDriverRole: defaultValues?.isDriverRole || false,
            permissionIds: defaultValues?.permissionIds || [],
        },
    });

    const groupedPermissions = groupPermissionsByResource(availablePermissions);
    const resourceNames = Object.keys(groupedPermissions).sort();

    const handleSelectAll = (resource: string, checked: boolean) => {
        const currentPerms = form.getValues("permissionIds");
        const resourcePermIds = groupedPermissions[resource].map((p) => p.id);

        if (checked) {
            // Add all permissions from this resource
            const newPerms = Array.from(new Set([...currentPerms, ...resourcePermIds]));
            form.setValue("permissionIds", newPerms, { shouldValidate: true });
        } else {
            // Remove all permissions from this resource
            const newPerms = currentPerms.filter((id) => !resourcePermIds.includes(id));
            form.setValue("permissionIds", newPerms, { shouldValidate: true });
        }
    };

    const isResourceFullySelected = (resource: string): boolean => {
        const currentPerms = form.watch("permissionIds");
        const resourcePermIds = groupedPermissions[resource].map((p) => p.id);
        return resourcePermIds.every((id) => currentPerms.includes(id));
    };

    return (
        <Form {...form}>
            <form id="role-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Role Name */}
                <FormField
                    control={form.control}
                    name="roleName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="e.g., Project Manager" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Describe the purpose of this role..."
                                    rows={3}
                                />
                            </FormControl>
                            <FormDescription>{field.value.length}/500 characters</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Is Driver Role */}
                <FormField
                    control={form.control}
                    name="isDriverRole"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Is Driver Role</FormLabel>
                                <FormDescription>
                                    Check this if users with this role should be able to be assigned as
                                    drivers and have access to driver-specific fields (vehicle type,
                                    mobility accommodations, etc.)
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                {/* Permissions */}
                <FormField
                    control={form.control}
                    name="permissionIds"
                    render={() => (
                        <FormItem>
                            <FormLabel>Permission List</FormLabel>
                            <FormDescription>
                                Select the permissions this role should have
                            </FormDescription>
                            <Accordion type="multiple" className="w-full">
                                {resourceNames.map((resource) => {
                                    const resourcePerms = groupedPermissions[resource];
                                    const isAllSelected = isResourceFullySelected(resource);

                                    return (
                                        <AccordionItem key={resource} value={resource}>
                                            <AccordionTrigger>
                                                <div className="flex items-center justify-between w-full pr-4">
                                                    <span>{capitalizeResource(resource)}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {resourcePerms.length} permissions
                                                    </span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="space-y-3 pt-2">
                                                {/* Select All checkbox */}
                                                <div className="flex items-center space-x-2 pb-2 border-b">
                                                    <Checkbox
                                                        id={`select-all-${resource}`}
                                                        checked={isAllSelected}
                                                        onCheckedChange={(checked) =>
                                                            handleSelectAll(
                                                                resource,
                                                                checked as boolean
                                                            )
                                                        }
                                                    />
                                                    <label
                                                        htmlFor={`select-all-${resource}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        Select All
                                                    </label>
                                                </div>

                                                {/* Individual permissions */}
                                                {resourcePerms.map((permission) => (
                                                    <FormField
                                                        key={permission.id}
                                                        control={form.control}
                                                        name="permissionIds"
                                                        render={({ field }) => (
                                                            <FormItem className="flex items-start space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(
                                                                            permission.id
                                                                        )}
                                                                        onCheckedChange={(
                                                                            checked
                                                                        ) => {
                                                                            return checked
                                                                                ? field.onChange([
                                                                                      ...field.value,
                                                                                      permission.id,
                                                                                  ])
                                                                                : field.onChange(
                                                                                      field.value?.filter(
                                                                                          (value) =>
                                                                                              value !==
                                                                                              permission.id
                                                                                      )
                                                                                  );
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <div className="space-y-1 leading-none">
                                                                    <FormLabel className="font-normal cursor-pointer">
                                                                        {permission.name}
                                                                    </FormLabel>
                                                                    <FormDescription>
                                                                        {permission.description}
                                                                    </FormDescription>
                                                                </div>
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
}
