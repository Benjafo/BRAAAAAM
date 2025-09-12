import { Button } from "./ui/button";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import FormField from "./ui/FormField";

/**
 * Props interface for the RegisterPage component
 * Allows customization of text content
 */
interface RegisterProps {
    heading?: string; // Custom heading text (defaults to "Register an Account")
    buttonText?: string; // Custom submit button text (defaults to "Register")
    loginText?: string; // Custom login link text (defaults to "Login")
}

/**
 * Zod validation schema for registration form data
 * Validates email format, phone format, password & confirm password formats.
 */
const registerSchema = z
    .object({
        email: z.email("Please enter a valid email address."),
        phone: z
            .string()
            .min(1, "Phone number is required")
            .regex(
                /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
                "Please enter a valid US phone number."
            ), // Regex validation for US phone number formats
        password: z.string().min(8, "Password must be at least 8 characters long."),
        confirmPassword: z.string().min(8, "Please confirm your password."),
    })
    // Custom validation to ensure passwords match
    .refine((data) => data.password === data.confirmPassword, {
        path: ["confirmPassword"], // attach error to confirmPassword field
        message: "Passwords do not match.",
    });

// TypeScript type inferred from the Zod schema
type RegisterData = z.infer<typeof registerSchema>;

/**
 * RegisterPage Component
 *
 * A reusable registration form component with comprehensive validation and customizable text content.
 * Features:
 * - Client-side form validation using Zod with password confirmation
 * - Phone number validation for US formats
 * @param props - RegisterProps object containing optional text customizations
 */
const RegisterPage = ({
    heading = "Register an Account",
    buttonText = "Register",
    loginText = "Login",
}: RegisterProps) => {
    // Hook for programmatic navigation after successful registration
    const navigate = useNavigate();

    // State to store form validation errors
    // Uses Record<string, string> to map field names to error messages
    const [errors, setErrors] = useState<Record<string, string>>({});

    /**
     * Form submission handler
     *
     * 1. Prevents default form submission
     * 2. Extracts form data using FormData API
     * 3. Validates data against Zod schema including password confirmation
     * 4. Sets validation errors or proceeds with registration
     *
     * @param e - Form submission event
     */
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default browser form submission

        // Extract form data using modern FormData API
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData) as Record<string, string>;

        // Validate form data against Zod schema
        const result = registerSchema.safeParse(data);

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
        const validData: RegisterData = result.data;

        // Replace with API logic later
        console.log("Form data:", validData);

        // Navigate to home page on successful registration
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
            {/* Centered container for the registration form */}
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
                            label="Email"
                            type="email"
                            placeholder="user@example.com"
                            errors={errors}
                            autoComplete="email"
                        />

                        {/* Phone number field with tel input type and mobile optimization */}
                        <FormField
                            id="phone"
                            label="Phone Number"
                            type="tel"
                            placeholder="(123) 456-7890"
                            errors={errors}
                            autoComplete="tel"
                            inputMode="tel" // Optimizes mobile keyboard for phone input
                        />

                        {/* Password field with new-password autocomplete hint */}
                        <FormField
                            id="password"
                            label="Password"
                            type="password"
                            placeholder="Password"
                            errors={errors}
                            autoComplete="new-password"
                        />

                        {/* Password confirmation field */}
                        <FormField
                            id="confirmPassword"
                            label="Re-enter Password"
                            type="password"
                            placeholder="Re-enter password"
                            errors={errors}
                            autoComplete="new-password"
                        />

                        {/* Submit button with full width and consistent styling */}
                        <Button type="submit" className="w-full bg-black text-white cursor-pointer">
                            {buttonText}
                        </Button>
                    </form>

                    {/* Login link for existing users */}
                    <div className="mt-3 text-center">
                        <Link to="/sign-in">
                            <span className="text-sm text-gray-700 hover:underline cursor-pointer">
                                {loginText}
                            </span>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
};

// export name
export { RegisterPage };
