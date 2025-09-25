import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useResetPassword } from "@/services/AuthService";

/**
 * Zod schema for password creation validation
 * Validates password requirements and confirmation matching
 */
const createPasswordSchema = z
    .object({
        newPassword: z.string().min(8, "Password must be at least 8 characters long."),
        confirmPassword: z.string().nonempty("Please confirm your password."),
    })
    // Custom validation to ensure passwords match
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"], // Attach error to confirmPassword field
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
    readonly confirmPassword?: FieldProps;
    readonly submitButtonText?: string;
}

/**
 * ResetPasswordForm Component
 * @param props - ResetPasswordFormProps object containing optional customizations
 * @returns
 */
function ResetPasswordForm({
    newPassword = { label: "New Password", placeholder: "New Password" },
    confirmPassword = { label: "Confirm Password", placeholder: "Confirm Password" },
    submitButtonText = "Set Password",
}: ResetPasswordFormProps) {
    const navigate = useNavigate();

    const search = useSearch({
        from: "/_login/reset-password",
    });

    const token = search.token;

    const resetPasswordMutation = useResetPassword();

    // React Hook Form setup with Zod validation
    const form = useForm<CreatePasswordFormData>({
        resolver: zodResolver(createPasswordSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
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

        try {
            /**
             * @TODO
             * Implement ky fetch to api and handle form data
             */

            await resetPasswordMutation.mutateAsync({
                newPassword: value.newPassword,
                confirmPassword: value.confirmPassword,
                token,
            });

            toast.success("Password reset successfully!");
            navigate({ to: "/dashboard" });
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("ResetPasswordForm onSubmit error", error);
            }

            toast.error("An error occurred while setting the new password. Please try again.");
        }
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
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{confirmPassword.label}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={confirmPassword.placeholder}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
                    {resetPasswordMutation.isPending ? "Setting Password..." : submitButtonText}
                </Button>
            </form>
        </Form>
    );
}

export default ResetPasswordForm;
