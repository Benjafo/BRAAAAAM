import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAuthStore } from "../stores/authStore";
import { mockAuthService } from "../../services/mockAuthService";
import { useEffect, useState } from "react";

/**
 * Zod schema for form validation
 * Validates email format and password requirements
 */
const signInSchema = z.object({
    email: z.email("Please enter a valid email address."),
    password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters long"),
});

// TypeScript type inferred from the Zod schema
type SignInFormData = z.infer<typeof signInSchema>;

// Props for individual form fields
type FieldProps = {
    readonly label: string;
    readonly placeholder: string;
};

/**
 * Props interface for the SignInForm component
 * Allows customization of labels, placeholders, and button text
 */
interface SignInFormProps {
    readonly email?: FieldProps;
    readonly password?: FieldProps;
    readonly submitButtonText?: string;
}

/**
 * SignInForm Component
 * @param props - SignInFormProps object containing optional customizations
 * @returns
 */
function SignInForm({
    email = { label: "Email", placeholder: "user@example.com" },
    password = { label: "Password", placeholder: "Password" },
    submitButtonText = "Sign In",
}: SignInFormProps) {
    const navigate = useNavigate();

    // Get auth state and actions from Zustand store
    const { user, isAuthenticated } = useAuthStore();

    // Local loading and error state for form submission
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "onBlur",
    });

    // Effect: Handle successful authentication by redirecting user
    // Note: Both admin and regular users redirect to "/", we will change this later when we have the routing properly developed
    useEffect(() => {
        if (user && isAuthenticated) {
            const redirectTo = user.role === "admin" ? "/" : "/";
            navigate({ to: redirectTo });
        }
    }, [user, isAuthenticated, navigate]);

    async function onSubmit(values: SignInFormData) {
        if (import.meta.env.DEV) {
            console.log("SignInForm onSubmit values", values);
        }

        setIsLoading(true);

        try {
            /**
             * @TODO
             * Implement ky fetch to api and handle form data
             * On success, navigate to page dependent by role/permissions returned
             */

            // Use the mock auth service to sign in (this will update Zustand store)
            await mockAuthService.signIn(values);

            toast.success(`Welcome back!`);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("SignInForm onSubmit error", error);
            }

            const errorMessage =
                error instanceof Error ? error.message : "Failed to sign in. Please try again.";

            // Show error toast notification
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
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

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{password.label}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder={password.placeholder}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing In..." : submitButtonText}
                    </Button>
                </form>
            </Form>
        </div>
    );
}

export default SignInForm;
