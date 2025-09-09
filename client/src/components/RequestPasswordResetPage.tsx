import { Button } from "./ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import FormField from "./ui/FormField";

/**
 * Props interface for the RequestPasswordResetPage component
 * Allows customization of text content
 */
interface RequestPasswordResetPageProps {
    heading?: string; // Main heading text (defaults to "Reset your password")
    buttonText?: string; // Submit button text (defaults to "Send Password Reset")
    requestHelpText?: string; // Help link text (defaults to "Request Admin Help")
}

/**
 * Zod schema for password reset form validation
 * Simple email validation for reset requests
 */
const requestPasswordResetSchema = z.object({
    email: z.email("Please enter a valid email address."),
});

// TypeScript type inferred from the Zod schema
type RequestPasswordResetData = z.infer<typeof requestPasswordResetSchema>;

/**
 * RequestPasswordResetPage Component
 *
 * A password reset request form component with email validation and customizable text content.
 * Features:
 * - Client-side email validation using Zod
 * - Accessible form structure with labels and error messages
 * - Simple single-field form for password reset requests
 *
 * @param props - RequestPasswordResetPageProps object containing optional text customizations
 */
const RequestPasswordResetPage = ({
    heading = "Reset your password",
    buttonText = "Send Password Reset",
    requestHelpText = "Request Admin Help",
}: RequestPasswordResetPageProps) => {
    // Hook for programmatic navigation after successful submission
    const navigate = useNavigate();

    // State to store form validation errors
    // Uses Record<string, string> to map field names to error messages
    const [errors, setErrors] = useState<Record<string, string>>({});

    /**
     * Form submission handler
     *
     * 1. Prevents default form submission
     * 2. Extracts form data using FormData API
     * 3. Validates email against Zod schema
     * 4. Sets validation errors or proceeds with password reset request
     *
     * @param e - Form submission event
     */
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default browser form submission

        // Extract form data using modern FormData API
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData) as Record<string, string>;

        // Validate form data against Zod schema
        const result = requestPasswordResetSchema.safeParse(data);

        // Handle validation errors
        if (!result.success) {
            const newErrors: Record<string, string> = {};
            // Map Zod validation errors to field-specific error messages
            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as string;
                newErrors[field] = issue.message;
            });
            setErrors(newErrors);
            return; // Exit early if validation fails
        }

        // Clear any previous errors on successful validation
        setErrors({});
        const validData: RequestPasswordResetData = result.data;

        // Replace with API logic later
        console.log("Password reset request data:", validData);

        // Should navigate to homepage/dashboard
        navigate({ to: "/" });
    };

    /**
     * Reusable FormField Component
     *
     * Creates a consistent form field structure with:
     * - Label properly associated with input
     * - Error message display
     * - Flexible prop passing for additional input attributes
     *
     * @param props - Field configuration including id, label, type, placeholder, and additional props
     */

    return (
        <main className="bg-[#FAFAFA] rounded-[15px] m-2.5">
            {/* Centered container for the password reset form */}
            <section className="flex items-center justify-center min-h-[calc(100vh-90px)]">
                {/* Form card with consistent styling */}
                <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
                    {/* Conditional heading display based on props */}
                    {heading && (
                        <h1 className="mb-6 text-center text-xl font-semibold">{heading}</h1>
                    )}

                    {/* Form with noValidate to use custom validation instead of browser defaults */}
                    <form onSubmit={handleSubmit} noValidate>
                        {/* Email field with proper autocomplete for password managers */}
                        <FormField
                            id="email"
                            label="Email Address"
                            type="email"
                            placeholder="user@example.com"
                            errors={errors}
                            autoComplete="email"
                        />

                        {/* Submit button with full width and consistent styling */}
                        <Button type="submit" className="w-full bg-black text-white cursor-pointer">
                            {buttonText}
                        </Button>
                    </form>

                    {/* Help/support link for users who need assistance, dud link for now */}
                    <div className="mt-3 text-center">
                        <Link to="/">
                            <span className="text-sm text-gray-700 hover:underline cursor-pointer">
                                {requestHelpText}
                            </span>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
};

// export name
export { RequestPasswordResetPage };
