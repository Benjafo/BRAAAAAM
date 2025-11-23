import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { http } from "@/services/auth/serviceResolver";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

/**
 * Available theme options (AI help)
 */
const THEMES = {
    LIGHT: "light",
    DARK: "dark",
    DARK_AMBER: "dark-amber",
    OCEAN_BLUE: "ocean-blue",
    FOREST_GREEN: "forest-green",
    SUNSET_PURPLE: "sunset-purple",
    MIDNIGHT_SLATE: "midnight-slate",
    CORAL_REEF: "coral-reef",
} as const;

type Theme = (typeof THEMES)[keyof typeof THEMES];

const THEME_STORAGE_KEY = "app-theme";

/**
 * Apply theme to document root (AI help)
 */
const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove(
        "dark",
        "dark-amber",
        "ocean-blue",
        "forest-green",
        "sunset-purple",
        "midnight-slate",
        "coral-reef"
    );

    // Apply selected theme
    if (theme === THEMES.DARK) {
        root.classList.add("dark");
    } else if (theme === THEMES.DARK_AMBER) {
        root.classList.add("dark-amber");
    } else if (theme === THEMES.OCEAN_BLUE) {
        root.classList.add("ocean-blue");
    } else if (theme === THEMES.FOREST_GREEN) {
        root.classList.add("forest-green");
    } else if (theme === THEMES.SUNSET_PURPLE) {
        root.classList.add("sunset-purple");
    } else if (theme === THEMES.MIDNIGHT_SLATE) {
        root.classList.add("midnight-slate");
    } else if (theme === THEMES.CORAL_REEF) {
        root.classList.add("coral-reef");
    }
    // Light theme is the default
};

/**
 * Get theme from localStorage or default to light (AI help)
 */
const getStoredTheme = (): Theme => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (
        stored === THEMES.DARK ||
        stored === THEMES.DARK_AMBER ||
        stored === THEMES.LIGHT ||
        stored === THEMES.OCEAN_BLUE ||
        stored === THEMES.FOREST_GREEN ||
        stored === THEMES.SUNSET_PURPLE ||
        stored === THEMES.MIDNIGHT_SLATE ||
        stored === THEMES.CORAL_REEF
    ) {
        return stored;
    }
    return THEMES.LIGHT;
};

/**
 * Save theme to localStorage (AI help)
 */
const saveTheme = (theme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
};

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
        .min(1, "Organization subdomain is required")
        .regex(/^[a-z0-9]([a-z0-9-]{0,13}[a-z0-9])?$/, "Please enter a valid subdomain"),
    theme: z.enum([
        THEMES.LIGHT,
        THEMES.DARK,
        THEMES.DARK_AMBER,
        THEMES.OCEAN_BLUE,
        THEMES.FOREST_GREEN,
        THEMES.SUNSET_PURPLE,
        THEMES.MIDNIGHT_SLATE,
        THEMES.CORAL_REEF,
    ]),
    creationDate: z.date(),

    // Organization Contacts
    phone: z
        .string()
        .regex(
            /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
            "Please enter a valid phone number"
        )
        .optional()
        .or(z.literal("")),
    email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),

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
    state: z.string().length(2, "State must be exactly 2 characters"),
    country: z
        .string()
        .min(1, "Country is required")
        .max(255, "Country must not exceed 255 characters"),
});

type AdminGeneralFormData = z.infer<typeof adminGeneralSchema>;

interface AdminGeneralFormProps {
    isEditMode?: boolean;
}

export interface AdminGeneralFormRef {
    handleSave: () => Promise<boolean>;
    handleCancel: () => void;
}

export const AdminGeneralForm = forwardRef<AdminGeneralFormRef, AdminGeneralFormProps>(
    ({ isEditMode = false }, ref) => {
        const [serverData, setServerData] = useState<AdminGeneralFormData | null>(null);
        const [isLoading, setIsLoading] = useState<boolean>(true);
        const [loadError, setLoadError] = useState<string | null>(null);
        const [logoFile, setLogoFile] = useState<File | null>(null);
        const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

        // Refs
        const serverDataRef = useRef(serverData);
        const fileInputRef = useRef<HTMLInputElement>(null);
        const savedThemeRef = useRef<Theme>(getStoredTheme());

        // React Hook Form setup with Zod validation
        const form = useForm<AdminGeneralFormData>({
            resolver: zodResolver(adminGeneralSchema),
            mode: "onBlur",
        });

        // Apply stored theme on mount (AI help)
        useEffect(() => {
            const storedTheme = getStoredTheme();
            applyTheme(storedTheme);
            savedThemeRef.current = storedTheme;
        }, []);

        // Keep serverDataRef in sync with serverData
        useEffect(() => {
            serverDataRef.current = serverData;
        }, [serverData]);

        // Cleanup URLs to prevent memory leaks
        useEffect(() => {
            return () => {
                if (serverData?.logoUrl && serverData.logoUrl.startsWith("blob:")) {
                    URL.revokeObjectURL(serverData.logoUrl);
                }
            };
        }, [serverData?.logoUrl]);

        // Fetch organization settings on mount
        useEffect(() => {
            const fetchOrgSettings = async () => {
                setIsLoading(true);
                setLoadError(null);
                try {
                    const response = await http.get("o/settings").json<{
                        name: string;
                        subdomain: string;
                        logoPath?: string;
                        phone?: string;
                        email?: string;
                        website?: string;
                        addressLine1: string;
                        addressLine2?: string;
                        city: string;
                        state: string;
                        zip: string;
                        country: string;
                        establishedDate?: string;
                        createdAt: string;
                    }>();

                    // Map API response to form data
                    const mappedData: AdminGeneralFormData = {
                        name: response.name,
                        organizationDomain: response.subdomain,
                        logoUrl: response.logoPath || "",
                        phone: response.phone || "",
                        email: response.email || "",
                        AddressLineOne: response.addressLine1,
                        AddressLineTwo: response.addressLine2 || "",
                        city: response.city,
                        state: response.state,
                        zip: response.zip,
                        country: response.country,
                        creationDate: response.establishedDate
                            ? new Date(response.establishedDate)
                            : new Date(response.createdAt),
                        theme: getStoredTheme(),
                    };

                    setServerData(mappedData);
                    form.reset(mappedData);
                } catch (error) {
                    console.error("Failed to fetch organization settings:", error);
                    setLoadError("Failed to load organization settings. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchOrgSettings();
        }, [form]);

        // Handle theme change in edit mode (preview only, don't save) (AI help)
        const handleThemeChange = useCallback((newTheme: Theme) => {
            applyTheme(newTheme);
        }, []);

        // Handling logo file change
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

        // Handling cancel (AI help)
        const handleCancel = useCallback(() => {
            if (!serverDataRef.current) return;

            // Reset to server data using ref
            form.reset(serverDataRef.current);
            setLogoFile(null);

            // Revert theme to the last saved theme
            const savedTheme = savedThemeRef.current;
            applyTheme(savedTheme);
            form.setValue("theme", savedTheme);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }, [form]);

        // Handling save data (AI help)
        const handleSave = useCallback(async (): Promise<boolean> => {
            if (!serverData) {
                toast.error("No data to save");
                return false;
            }

            try {
                // Validate form
                const isValid = await form.trigger();
                if (!isValid) {
                    toast.error("Please fix the errors in the form before saving.");
                    return false;
                }

                const formData = form.getValues();

                // Handle logo file upload if a new file was selected (AI help)
                if (logoFile) {
                    // Revoke previous blob URL if it exists
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
                const requestBody = {
                    name: formData.name,
                    logoPath: formData.logoUrl,
                    phone: formData.phone,
                    email: formData.email,
                    addressLine1: formData.AddressLineOne,
                    addressLine2: formData.AddressLineTwo,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip,
                    country: formData.country,
                    establishedDate: formData.creationDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD
                };

                await http.put("o/settings", { json: requestBody }).json();

                // Update server data state with saved values
                setServerData(formData);

                // Save theme to localStorage and update saved ref (AI help)
                saveTheme(formData.theme);
                savedThemeRef.current = formData.theme;
                applyTheme(formData.theme);

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
        }, [form, logoFile, serverData?.logoUrl]);

        // Code for edit button to work in admin settings route (AI help)
        useImperativeHandle(
            ref,
            () => ({
                handleSave,
                handleCancel,
            }),
            [handleSave, handleCancel]
        );

        const getThemeLabel = (theme: Theme): string => {
            switch (theme) {
                case THEMES.LIGHT:
                    return "Light";
                case THEMES.DARK:
                    return "Dark";
                case THEMES.DARK_AMBER:
                    return "Dark Amber";
                case THEMES.OCEAN_BLUE:
                    return "Ocean Blue";
                case THEMES.FOREST_GREEN:
                    return "Forest Green";
                case THEMES.SUNSET_PURPLE:
                    return "Sunset Purple";
                case THEMES.MIDNIGHT_SLATE:
                    return "Midnight Slate";
                case THEMES.CORAL_REEF:
                    return "Coral Reef";
                default:
                    return theme;
            }
        };

        // Show loading state
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                        <p className="mt-4 text-sm text-muted-foreground">
                            Loading organization settings...
                        </p>
                    </div>
                </div>
            );
        }

        // Show error state
        if (loadError) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Card className="w-full max-w-md">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-destructive">{loadError}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 text-sm text-primary hover:underline"
                                >
                                    Reload page
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        // Show form only when data is loaded
        if (!serverData) {
            return null;
        }

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
                                            <FormLabel className="font-medium">Name</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="Name"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    {field.value || "Empty"}
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormItem className="grid gap-3">
                                    <FormLabel className="font-medium">Logo</FormLabel>
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
                                                <p className="text-sm text-muted-foreground">
                                                    No logo uploaded
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </FormItem>

                                <FormField
                                    control={form.control}
                                    name="organizationDomain"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel className="font-medium">
                                                Organization Subdomain
                                            </FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input className="w-80" {...field} />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    {field.value || "Empty"}
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Theme form field, help from AI */}
                                <FormField
                                    control={form.control}
                                    name="theme"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel className="font-medium">Theme</FormLabel>
                                            {isEditMode ? (
                                                <>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            handleThemeChange(value as Theme);
                                                        }}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-80">
                                                                <SelectValue placeholder="Select a theme" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value={THEMES.LIGHT}>
                                                                Light
                                                            </SelectItem>
                                                            <SelectItem value={THEMES.DARK}>
                                                                Dark
                                                            </SelectItem>
                                                            <SelectItem value={THEMES.DARK_AMBER}>
                                                                Dark Amber
                                                            </SelectItem>
                                                            <SelectItem value={THEMES.OCEAN_BLUE}>
                                                                Ocean Blue
                                                            </SelectItem>
                                                            <SelectItem value={THEMES.FOREST_GREEN}>
                                                                Forest Green
                                                            </SelectItem>
                                                            <SelectItem
                                                                value={THEMES.SUNSET_PURPLE}
                                                            >
                                                                Sunset Purple
                                                            </SelectItem>
                                                            <SelectItem
                                                                value={THEMES.MIDNIGHT_SLATE}
                                                            >
                                                                Midnight Slate
                                                            </SelectItem>
                                                            <SelectItem value={THEMES.CORAL_REEF}>
                                                                Coral Reef
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    {getThemeLabel(field.value)}
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
                                            <FormLabel className="font-medium">Phone</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="(111) 111-1111"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
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
                                            <FormLabel className="font-medium">Email</FormLabel>
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
                                                <p className="text-sm text-muted-foreground">
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
                                    name="AddressLineOne"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel className="font-medium">
                                                Address Line One
                                            </FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="123 Main St"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    {field.value || "Empty"}
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {(isEditMode || form.watch("AddressLineTwo")) && (
                                    <FormField
                                        control={form.control}
                                        name="AddressLineTwo"
                                        render={({ field }) => (
                                            <FormItem className="grid gap-3">
                                                <FormLabel className="font-medium">
                                                    Address Line Two
                                                </FormLabel>
                                                {isEditMode ? (
                                                    <FormControl>
                                                        <Input
                                                            placeholder="456 Random St"
                                                            className="w-80"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        {field.value}
                                                    </p>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <FormField
                                    control={form.control}
                                    name="zip"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-3">
                                            <FormLabel className="font-medium">Zip</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="12345"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
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
                                            <FormLabel className="font-medium">City</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="New York"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
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
                                            <FormLabel className="font-medium">State</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="NY"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    {field.value || "Empty"}
                                                </p>
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
                                            <FormLabel className="font-medium">Country</FormLabel>
                                            {isEditMode ? (
                                                <FormControl>
                                                    <Input
                                                        placeholder="United States"
                                                        className="w-80"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
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
            </div>
        );
    }
);
AdminGeneralForm.displayName = "AdminGeneralForm";

export default AdminGeneralForm;
