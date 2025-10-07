import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { toast } from "sonner";

import z from "zod";

/**
 * Zod schema for admin general settings validation
 */
const adminGeneralSchema = z.object({
    // Organization
    name: z
        .string()
        .min(1, "Organization name is required")
        .min(2, "Name must be at least 2 characters")
        .max(255, "Name must not exceed 255 characters"),
    logoUrl: z.url("Please enter a valid URL").optional().or(z.literal("")),
    organizationDomain: z
        .string()
        .min(1, "Organization domain is required")
        .regex(
            /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
            "Please enter a valid domain (e.g., example.com)"
        ),
    creationDate: z.date(),

    // Organization Contacts
    phone: z
        .string()
        .min(1, "Phone number is required")
        .regex(
            /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
            "Please enter a valid phone number"
        ),
    email: z.email("Please enter a valid email address"),

    // Organization Mailing Address
    AddressLineOne: z
        .string()
        .min(1, "Street address is required")
        .max(255, "Street address must not exceed 255 characters"),
    AddressLineTwo: z.string().max(255, "Street address must not exceed 255 characters").optional(),
    zip: z
        .string()
        .min(1, "Zip code is required")
        .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid zip code (e.g., 12345 or 12345-6789)"),
    city: z.string().min(1, "City is required").max(255, "City must not exceed 255 characters"),
    state: z.string().length(2, "City must be exactly 2 characters"),
    country: z
        .string()
        .min(1, "Country is required")
        .max(255, "Country must not exceed 255 characters"),

    // API Keys
    postmarkApiKey: z
        .string()
        .min(1, "Postmark API Key is required")
        .max(255, "API Key must not exceed 255 characters"),
    apiDomain: z
        .string()
        .min(1, "API domain is required")
        .regex(
            /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
            "Please enter a valid domain (e.g., api.example.com)"
        ),
});

type AdminGeneralFormData = z.infer<typeof adminGeneralSchema>;

const testData: AdminGeneralFormData = {
    name: "corporation name",
    logoUrl: "",
    organizationDomain: "corporation.com",
    creationDate: new Date("2025-09-10"),
    phone: "(111) 111-1111",
    email: "contact@gmail.com",
    AddressLineOne: "123 Main St",
    AddressLineTwo: "456 Random St",
    zip: "12345",
    city: "New York",
    country: "United States",
    state: "NY",
    postmarkApiKey: "pm_test_1234567890",
    apiDomain: "api.google.com",
};

interface AdminGeneralFormProps {
    isEditMode?: boolean;
}

export interface AdminGeneralFormRef {
    handleSave: () => Promise<boolean>;
    handleCancel: () => void;
}

export const AdminGeneralForm = forwardRef<AdminGeneralFormRef, AdminGeneralFormProps>(
    ({ isEditMode = false }, ref) => {
        const [serverData, setServerData] = useState<AdminGeneralFormData>(testData);
        const [logoFile, setLogoFile] = useState<File | null>(null);
        const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

        // Refs (Recomended by AI)
        const serverDataRef = useRef(serverData);
        const fileInputRef = useRef<HTMLInputElement>(null);

        // React Hook Form setup with Zod validation
        const form = useForm<AdminGeneralFormData>({
            resolver: zodResolver(adminGeneralSchema),
            defaultValues: serverData,
            mode: "onBlur",
        });

        // Keep serverDataRef in sync with serverData (Recomended by AI)
        useEffect(() => {
            serverDataRef.current = serverData;
        }, [serverData]);

        // Cleanup URLs to prevent memory leaks (Recomended by AI)
        useEffect(() => {
            return () => {
                if (serverData.logoUrl && serverData.logoUrl.startsWith("blob:")) {
                    URL.revokeObjectURL(serverData.logoUrl);
                }
            };
        }, [serverData.logoUrl]);

        // Handling logo file change, AI was in some part of handleLogoChange
        const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // Validate file size (2MB max)
            const MAX_FILE_SIZE = 2 * 1024 * 1024;
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File size must be less than 2MB");
                e.target.value = "";
                return;
            }

            // Validate file type
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                toast.error("Please upload a valid image file (JPEG, PNG, or WebP)");
                e.target.value = "";
                return;
            }

            setLogoFile(file);
        }, []);

        // Handling cancel
        const handleCancel = useCallback(() => {
            // Reset to server data using ref
            form.reset(serverDataRef.current);
            setLogoFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }, [form]);

        // Handling save data
        const handleSave = useCallback(async (): Promise<boolean> => {
            try {
                // Validate form
                const isValid = await form.trigger();
                if (!isValid) {
                    toast.error("Please fix the errors in the form before saving.");
                    return false;
                }

                const formData = form.getValues();

                // Handle logo file upload if a new file was selected
                if (logoFile) {
                    // Revoke previous blob URL if it exists (AI help)
                    if (serverData.logoUrl && serverData.logoUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(serverData.logoUrl);
                    }

                    // Create a temporary object URL for preview
                    const tempUrl = URL.createObjectURL(logoFile);
                    formData.logoUrl = tempUrl;

                    // Store the uploaded file name
                    setUploadedFileName(logoFile.name);

                    // TODO: Implement actual file upload to the backend
                    // const uploadedUrl = await uploadLogo(logoFile);
                    // formData.logoUrl = uploadedUrl;
                    console.log("Logo file to upload:", logoFile);
                } else {
                    // Preserve existing logo if no new file was selected
                    formData.logoUrl = serverData.logoUrl;
                }

                // API Call to save data
                // TODO: Replace with actual API call using ky
                // await ky.put(...)
                console.log("Saving data:", formData);

                // Update server data state with saved values
                setServerData(formData);
                setLogoFile(null);

                // Clear file input after successful save
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }

                toast.success("Settings saved successfully.");
                return true;
            } catch (error) {
                console.error("Save failed:", error);
                toast.error("Failed to save settings. Please try again.");
                return false;
            }
        }, [form, logoFile, serverData.logoUrl]);

        // Code for edit button to work in admin settings route, might be a better way to do this? Don't know for now
        useImperativeHandle(
            ref,
            () => ({
                handleSave,
                handleCancel,
            }),
            [handleSave, handleCancel]
        );

        return (
            <div>
                <Form {...form}>
                    <fieldset disabled={form.formState.isSubmitting} className="space-y-2.5">
                        {/* Organization Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Organization</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>Name</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="Name"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">{field.value || "Empty"}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormItem className="grid gap-3">
                                    <FormLabel>Logo</FormLabel>
                                    {isEditMode ? (
                                        <div className="space-y-3">
                                            {serverData.logoUrl && (
                                                <div className="space-y-2">
                                                    <img
                                                        src={serverData.logoUrl}
                                                        alt="Organization logo"
                                                        className="h-16 w-auto object-contain border rounded p-2"
                                                    />
                                                    {uploadedFileName && (
                                                        <p className="text-sm text-muted-foreground">
                                                            Current file: {uploadedFileName}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    className="w-80 cursor-pointer"
                                                    onChange={handleLogoChange}
                                                />
                                                {logoFile ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        New file selected: {logoFile.name}
                                                    </p>
                                                ) : serverData.logoUrl ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        Choose a file to replace the current logo
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">
                                                        Choose a file to upload
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {serverData.logoUrl ? (
                                                <>
                                                    <img
                                                        src={serverData.logoUrl}
                                                        alt="Organization logo"
                                                        className="h-16 w-auto object-contain border rounded p-2"
                                                    />
                                                    {uploadedFileName && (
                                                        <p className="text-sm text-muted-foreground">
                                                            Current file: {uploadedFileName}
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-sm">No logo uploaded</p>
                                            )}
                                        </div>
                                    )}
                                </FormItem>

                                <FormField
                                    control={form.control}
                                    name="organizationDomain"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>Organization Domain</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="example.com"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">{field.value || "Empty"}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Organization Contacts Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Organization Contacts</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>Phone</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="(111) 111-1111"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">{field.value || "Empty"}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>Email</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="contact@gmail.com"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">{field.value || "Empty"}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Organization Mailing Address Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Organization Mailing Address</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <FormField
                                    control={form.control}
                                    name="AddressLineOne"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>Address Line One</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="123 Main St"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">{field.value || "Empty"}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="AddressLineTwo"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>Address Line Two</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="456 Random St"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">{field.value}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="zip"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>Zip</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="12345"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">{field.value || "Empty"}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>City</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="New York"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">{field.value || "Empty"}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>State</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="NY"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">{field.value || "Empty"}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>Country</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="United States"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">{field.value || "Empty"}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* API Keys Card */}
                        <Card className="mb-2.5">
                            <CardHeader>
                                <CardTitle>API Keys</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <FormField
                                    control={form.control}
                                    name="postmarkApiKey"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>Postmark API Key</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Enter API key"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">
                                                    {field.value ? "••••••••••••" : "Empty"}
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="apiDomain"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel>API Domain</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="api.example.com"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm">{field.value || "Empty"}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </fieldset>
                </Form>
            </div>
        );
    }
);
AdminGeneralForm.displayName = "AdminGeneralForm";

export default AdminGeneralForm;
