import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAuth } from "../../hooks/useAuth";
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
    readonly showDemoAccounts?: boolean;
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
    showDemoAccounts = true, // Flag to show/hide demo accounts feature
}: SignInFormProps) {
    const navigate = useNavigate();
    // Authentication context providing sign-in functionality, loading state, and error handling
    const { signIn, isLoading, error, clearError, user } = useAuth();
    const [showDemoAccountsPanel, setShowDemoAccountsPanel] = useState(false);

    const form = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "onBlur",
    });

    useEffect(() => {
        clearError();
    }, [clearError]);

    // Effect: Handle successful authentication by redirecting user
    // Note: Both admin and regular users redirect to "/", we will change this later when we have the routing properly developed
    useEffect(() => {
        if (user) {
            const redirectTo = user.role === "admin" ? "/" : "/";
            navigate({ to: redirectTo });
        }
    }, [user, navigate]);

    async function onSubmit(values: SignInFormData) {
        if (import.meta.env.DEV) {
            console.log("SignInForm onSubmit values", values);
        }

        try {
            /**
             * @TODO
             * Implement ky fetch to api and handle form data
             * On success, navigate to page dependent by role/permissions returned
             */
            await signIn(values);
            toast.success(`Welcome back!`);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("SignInForm onSubmit error", error);
            }

            const errorMessage =
                error instanceof Error ? error.message : "Failed to sign in. Please try again.";
            // Show error toast notification
            toast.error(errorMessage);
        }
    }

    function fillDemoAccount(email: string, password: string) {
        form.setValue("email", email);
        form.setValue("password", password);
        setShowDemoAccountsPanel(false);
        toast.info("Demo account credentials filled in");
    }

    const demoAccounts = mockAuthService.getDemoAccounts();

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

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

            {/* Demo Accounts Section */}
            {showDemoAccounts && (
                <div className="border-t pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full mb-4"
                        onClick={() => setShowDemoAccountsPanel(!showDemoAccountsPanel)}
                    >
                        {showDemoAccountsPanel ? "Hide" : "Show"} Demo Accounts
                    </Button>

                    {showDemoAccountsPanel && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 mb-3">
                                Click any demo account to fill in the credentials:
                            </p>

                            {demoAccounts.map((account) => (
                                <div
                                    key={account.email}
                                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => fillDemoAccount(account.email, account.password)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-sm">
                                                {account.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {account.email}
                                            </div>
                                            <div className="text-xs text-blue-600">
                                                Role: {account.role}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">
                                            {account.password}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SignInForm;
