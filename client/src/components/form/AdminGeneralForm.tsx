import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useEffect, useState } from "react";
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
        .max(100, "Name must not exceed 100 characters"),
    logoUrl: z.url("Please enter a valid URL").optional().or(z.literal("")),
    organizationDomain: z
        .string()
        .min(1, "Organization domain is required")
        .regex(
            /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
            "Please enter a valid domain (e.g., example.com)"
        ),

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
    street: z
        .string()
        .min(1, "Street address is required")
        .max(200, "Street address must not exceed 200 characters"),
    addressDomain: z
        .string()
        .optional()
        .or(z.literal(""))
        .refine(
            (val) =>
                !val ||
                /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i.test(
                    val
                ),
            "Please enter a valid domain (e.g., example.com)"
        ),
    zip: z
        .string()
        .min(1, "Zip code is required")
        .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid zip code (e.g., 12345 or 12345-6789)"),
    city: z.string().min(1, "City is required").max(100, "City must not exceed 100 characters"),
    state: z.string().min(1, "State is required").max(50, "State must not exceed 50 characters"),

    // API Keys
    postmarkApiKey: z
        .string()
        .min(1, "Postmark API Key is required")
        .max(200, "API Key must not exceed 200 characters"),
    apiDomain: z
        .string()
        .min(1, "API domain is required")
        .regex(
            /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
            "Please enter a valid domain (e.g., api.example.com)"
        ),
});

type AdminGeneralFormData = z.infer<typeof adminGeneralSchema>;

function AdminGeneralForm() {
    const [activeTab, setActiveTab] = useState("general");
    const [isEditMode, setIsEditMode] = useState(false);
    const [serverData, setServerData] = useState<AdminGeneralFormData>({
        name: "corporation name",
        logoUrl: "",
        organizationDomain: "corporation.com",
        phone: "(111) 111-1111",
        email: "contact@gmail.com",
        street: "123 Main St",
        addressDomain: "",
        zip: "12345",
        city: "New York",
        state: "NY",
        postmarkApiKey: "pm_test_1234567890",
        apiDomain: "api.google.com",
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // React Hook Form setup with Zod validation
    const form = useForm<AdminGeneralFormData>({
        resolver: zodResolver(adminGeneralSchema),
        defaultValues: serverData,
        mode: "onBlur",
    });

    // Reset edit mode when switching tabs
    useEffect(() => {
        if (activeTab !== "general" && isEditMode) {
            form.reset(serverData);
            setIsEditMode(false);
            setLogoFile(null);
        }
    }, [activeTab, isEditMode, form, serverData]);

    // Handling save data
    const handleEditOrSave = async () => {
        if (isEditMode) {
            try {
                // Validate form
                const isValid = await form.trigger();
                if (!isValid) {
                    toast.error("Please fix the errors in the form before saving.");
                    return;
                }

                const formData = form.getValues();

                // Handle logo file upload if a new file was selected
                if (logoFile) {
                    // TODO: Implement actual file upload to the backend
                    // const uploadedUrl = await uploadLogo(logoFile);
                    // formData.logoUrl = uploadedUrl;
                    console.log("Logo file to upload:", logoFile);
                }

                // API Call to save data
                // TODO: Replace with actual API call
                // await updateAdminSettings(formData);
                console.log("Saving data:", formData);

                // Update server data state with saved values
                setServerData(formData);
                setIsEditMode(false);
                setLogoFile(null);

                toast.success("Settings saved successfully.");
            } catch (error) {
                console.error("Save failed:", error);
                toast.error("Failed to save settings. Please try again.");
            }
        } else {
            // Enter edit mode
            setIsEditMode(true);
        }
    };

    const handleCancel = () => {
        // Reset to server data
        form.reset(serverData);
        setIsEditMode(false);
        setLogoFile(null);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
        }
    };

    const getButtonText = () => {
        if (activeTab === "general") {
            return isEditMode ? "Save Changes" : "Edit Page";
        }
        switch (activeTab) {
            case "forms":
                return "Save Changes";
            case "roles":
                return "New Role";
            case "audit-log":
                return "Export";
            case "locations":
                return "New Alias";
            default:
                return "Edit Page";
        }
    };

    return (
        <div className="w-full px-2.5">
            <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-6 pt-2.5">
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="forms">Forms</TabsTrigger>
                        <TabsTrigger value="roles">Roles</TabsTrigger>
                        <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
                        <TabsTrigger value="locations">Locations</TabsTrigger>
                    </TabsList>
                    {activeTab === "general" && (
                        <div className="flex gap-2">
                            {isEditMode && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={handleCancel}
                                    disabled={form.formState.isSubmitting}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleEditOrSave}
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : getButtonText()}
                            </Button>
                        </div>
                    )}
                    {activeTab !== "general" && (
                        <Button variant="outline">{getButtonText()}</Button>
                    )}
                </div>

                <TabsContent value="general">
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
                                                    <p className="text-sm">
                                                        {field.value || "Empty"}
                                                    </p>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormItem className="grid gap-3">
                                        <FormLabel>Logo</FormLabel>
                                        {isEditMode ? (
                                            <div className="space-y-2">
                                                <Input
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    className="w-80 cursor-pointer"
                                                    onChange={handleLogoChange}
                                                />
                                                {logoFile && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Selected: {logoFile.name}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm">
                                                {serverData.logoUrl || "No logo uploaded"}
                                            </p>
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
                                                    <p className="text-sm">
                                                        {field.value || "Empty"}
                                                    </p>
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
                                                    <p className="text-sm">
                                                        {field.value || "Empty"}
                                                    </p>
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
                                                    <p className="text-sm">
                                                        {field.value || "Empty"}
                                                    </p>
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
                                        name="street"
                                        render={({ field }) => (
                                            <FormItem className="grid gap-3">
                                                <FormLabel>Street Address</FormLabel>
                                                {isEditMode ? (
                                                    <FormControl>
                                                        <Input
                                                            placeholder="123 Main St"
                                                            className="w-80"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                ) : (
                                                    <p className="text-sm">
                                                        {field.value || "Empty"}
                                                    </p>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="addressDomain"
                                        render={({ field }) => (
                                            <FormItem className="grid gap-3">
                                                <FormLabel>
                                                    Address Domain{" "}
                                                    <span className="text-muted-foreground">
                                                        (optional)
                                                    </span>
                                                </FormLabel>
                                                {isEditMode ? (
                                                    <FormControl>
                                                        <Input
                                                            placeholder="domain.com"
                                                            className="w-80"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                ) : (
                                                    <p className="text-sm">
                                                        {field.value || "Empty"}
                                                    </p>
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
                                                    <p className="text-sm">
                                                        {field.value || "Empty"}
                                                    </p>
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
                                                    <p className="text-sm">
                                                        {field.value || "Empty"}
                                                    </p>
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
                                                    <p className="text-sm">
                                                        {field.value || "Empty"}
                                                    </p>
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
                                                    <p className="text-sm">
                                                        {field.value || "Empty"}
                                                    </p>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </fieldset>
                    </Form>
                </TabsContent>

                <TabsContent value="forms">
                    <p className="text-muted-foreground">{/* Add forms content  */}</p>
                </TabsContent>

                <TabsContent value="roles">
                    <p className="text-muted-foreground">{/* Add roles logic */}</p>
                </TabsContent>

                <TabsContent value="audit-log">
                    <p className="text-muted-foreground">{/* Add audit log logic */}</p>
                </TabsContent>

                <TabsContent value="locations">
                    <p className="text-muted-foreground">{/* Add locations logic */}</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default AdminGeneralForm;
