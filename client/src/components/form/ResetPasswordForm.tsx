import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useResetPassword } from "@/hooks/useAuth";

/**
 * Zod schema for password creation validation
 * Validates password requirements and confirmation matching
 */
const createPasswordSchema = z
    .object({
        newPassword: z.string().min(8, "Password must be at least 8 characters long."),
        confirmNewPassword: z.string().nonempty("Please confirm your password."),
    })
    // Custom validation to ensure passwords match
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords do not match.",
        path: ["confirmNewPassword"], // Attach error to confirmNewPassword field
    });

// TypeScript type inferred from the Zod schema
type CreatePasswordFormData = z.infer<typeof createPasswordSchema>;

// Props for individual form fields
type FieldProps = {
    readonly label: string;
    readonly placeholder: string;
};

// Props interface for the ResetPasswordForm component
interface ResetPasswordFormProps {
    readonly newPassword?: FieldProps;
    readonly confirmNewPassword?: FieldProps;
    readonly submitButtonText?: string;
}

/**
 * ResetPasswordForm Component
 * @param props - ResetPasswordFormProps object containing optional customizations
 * @returns
 */
function ResetPasswordForm({
    newPassword = { label: "New Password", placeholder: "New Password" },
    confirmNewPassword = { label: "Confirm Password", placeholder: "Confirm Password" },
    submitButtonText = "Set Password",
}: ResetPasswordFormProps) {
    const navigate = useNavigate();

    const search = useSearch({
        from: "/{-$subdomain}/_login/reset-password",
    });

    const token = search.token;
    const id = search.id; //userId

    const resetPassword = useResetPassword();

    // React Hook Form setup with Zod validation
    const form = useForm<CreatePasswordFormData>({
        resolver: zodResolver(createPasswordSchema),
        defaultValues: {
            newPassword: "",
            confirmNewPassword: "",
        },
        mode: "onBlur",
    });

    // Form submission handler
    async function onSubmit(value: CreatePasswordFormData) {
        // Log form data in development mode
        if (import.meta.env.DEV) {
            console.log("ResetPasswordForm onSubmit data", value);
        }

        if (!token) {
            toast.error("Invalid reset link. Please request a new password reset.");
            return;
        }

        resetPassword.mutate({ ...value, token, id }, {
            onSuccess: () => {
                toast.success('Password reset successfully!');
                navigate({ to: '/{-$subdomain}/sign-in' });
            },
            onError: (error) => {
                toast.error("Password failed to reset", {
                    description: error.message
                })
            }
        });
        
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{newPassword.label}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={newPassword.placeholder}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{confirmNewPassword.label}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={confirmNewPassword.placeholder}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
                    {resetPassword.isPending ? "Setting Password..." : submitButtonText}
                </Button>
            </form>
        </Form>
    );
}

export default ResetPasswordForm;
