import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useForgotPassword } from "@/services/AuthService";

/**
 * Zod schema for password reset form validation
 * Simple email validation for reset requests
 */
const requestPasswordResetSchema = z.object({
    email: z.email("Please enter a valid email address."),
});

// TypeScript type inferred from the Zod schema
type RequestPasswordResetFormData = z.infer<typeof requestPasswordResetSchema>;

// Props for individual form fields
type FieldProps = {
    readonly label: string;
    readonly placeholder: string;
};

// Props for individual form fields
interface RequestPasswordResetFormProps {
    readonly email?: FieldProps;
    readonly submitButtonText?: string;
}

/**
 * RequestPasswordResetForm Component
 * @param props - RequestPasswordResetFormProps object containing optional customizations
 */
function RequestPasswordResetForm({
    email = { label: "Email", placeholder: "user@example.com" },
    submitButtonText = "Send Password Reset",
}: RequestPasswordResetFormProps) {
    const forgotPasswordMutation = useForgotPassword();
    // React Hook Form setup with Zod validation
    const form = useForm<RequestPasswordResetFormData>({
        resolver: zodResolver(requestPasswordResetSchema),
        defaultValues: {
            email: "",
        },
        mode: "onBlur",
    });

    // Form submission handler
    async function onSubmit(data: RequestPasswordResetFormData) {
        // Log form data in development mode
        if (import.meta.env.DEV) {
            console.log("RequestPasswordResetForm onSubmit data", data);
        }

        try {
            /**
             * @TODO
             * Implement ky fetch to api and handle form data
             */

            const result = await forgotPasswordMutation.mutateAsync({
                email: data.email,
            });

            toast.success(result.message || "Password reset email sent!");
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("RequestPasswordResetForm onSubmit error", error);
            }

            toast.error("Failed to request password reset. Please try again.");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{email.label}</FormLabel>
                            <FormControl>
                                <Input placeholder={email.placeholder} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    className="w-full"
                    disabled={forgotPasswordMutation.isPending}
                >
                    {forgotPasswordMutation.isPending ? "Sending..." : submitButtonText}
                </Button>
            </form>
        </Form>
    );
}

export default RequestPasswordResetForm;
