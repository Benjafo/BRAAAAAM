import { Button } from "./ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import FormField from "./ui/FormField";

/**
 * Props interface for the SignInPage component
 * Allows customization of text content
 */
interface SignInProps {
    heading?: string; // Main heading text (defaults to "Sign in")
    buttonText?: string; // Submit button text (defaults to "Login")
    forgotText?: string; // Forgot password link text
    registerText?: string; // Register link text
}

/**
 * Zod schema for form validation
 * Validates email format and password requirements
 */
const signInSchema = z.object({
    email: z.email("Please enter a valid email address."),
    password: z
        .string()
        .min(1, "Password is required") // Check if password exists
        .min(8, "Password must be at least 8 characters long"), // Minimum length validation
});

// TypeScript type inferred from the Zod schema
type SignInData = z.infer<typeof signInSchema>;

/**
 * SignInPage Component
 *
 * A reusable sign-in form component with validation and customizable text content.
 * Features:
 * - Client-side form validation using Zod
 * - Accessible form structure with labels and error messages
 *
 * @param props - SignInProps object containing optional text customizations
 */
const SignInPage = ({
    heading = "Sign in",
    buttonText = "Login",
    forgotText = "Forgot Password",
    registerText = "Register",
}: SignInProps) => {
    // Hook for programmatic navigation after successful sign-in
    const navigate = useNavigate();

    // State to store form validation errors
    // Uses Record<string, string> to map field names to error messages
    const [errors, setErrors] = useState<Record<string, string>>({});

    /**
     * Form submission handler
     *
     * 1. Prevents default form submission
     * 2. Extracts form data using FormData API
     * 3. Validates data against Zod schema
     * 4. Sets validation errors or proceeds with sign-in
     *
     * @param e - Form submission event
     */
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default browser form submission

        // Extract form data using modern FormData API
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData) as Record<string, string>;

        // Validate form data against Zod schema
        const result = signInSchema.safeParse(data);

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
        const validData: SignInData = result.data;

        // Replace with API logic later
        console.log("Sign in data:", validData);

        // Navigate to home page on successful sign-in
        navigate({ to: "/" });
    };

    /**
     * Reusable FormField Component
     *
     * Creates a consistent form field structure with:
     * - Label associated with input via htmlFor/id
     * - Error message display
     * - Flexible prop passing for additional input attributes
     *
     * @param props - Field configuration including id, label, type, placeholder, and additional props
     */

    return (
        <main className="bg-[#FAFAFA] rounded-[15px] m-2.5">
            {/* Centered container for the sign-in form */}
            <section className="flex items-center justify-center min-h-[calc(100vh-90px)]">
                {/* Form card with consistent styling */}
                <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
                    {/* Dynamic heading based on props */}
                    <h1 className="mb-6 text-center text-xl font-semibold">{heading}</h1>

                    {/* Form with noValidate to use custom validation instead of browser defaults */}
                    <form onSubmit={handleSubmit} noValidate>
                        {/* Email field with proper autocomplete for password managers */}
                        <FormField
                            id="email"
                            label="User"
                            type="email"
                            placeholder="user@example.com"
                            errors={errors}
                            autoComplete="email"
                        />

                        {/* Password field with current-password autocomplete hint */}
                        <FormField
                            id="password"
                            label="Password"
                            type="password"
                            placeholder="Password"
                            errors={errors}
                            autoComplete="current-password"
                        />

                        {/* Submit button with full width and consistent styling */}
                        <Button type="submit" className="w-full bg-black text-white cursor-pointer">
                            {buttonText}
                        </Button>
                    </form>

                    {/* Forgot password link */}
                    <div className="mt-3 text-center">
                        <Link to="/reset-password">
                            <span className="text-sm text-gray-700 hover:underline cursor-pointer">
                                {forgotText}
                            </span>
                        </Link>
                    </div>

                    {/* Register link */}
                    <div className="mt-3 text-center">
                        <Link to="/register">
                            <span className="text-sm text-gray-700 hover:underline cursor-pointer">
                                {registerText}
                            </span>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
};

// export name
export { SignInPage };
