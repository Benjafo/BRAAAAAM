import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import FormField from "./ui/FormField";

/**
 * Props interface for the CreateNewPasswordPage component
 * Allows customization of text content
 */
interface CreateNewPasswordPageProps {
    heading?: string; // Main heading text (defaults to "Create a new password")
    buttonText?: string; // Submit button text (defaults to "Continue to Login")
    cancelText?: string; // Cancel link text (defaults to "Cancel")
}

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

/**
 * CreateNewPasswordPage Component
 *
 * A password creation form component for password reset flows with validation and customizable text content.
 * Features:
 * - Client-side password validation using Zod with confirmation matching
 * - Password strength requirements (minimum 8 characters)
 * - Navigation to sign-in page after successful password creation
 *
 * @param props - CreateNewPasswordPageProps object containing optional text customizations
 */
const CreateNewPasswordPage = ({
    heading = "Create a new password",
    buttonText = "Continue to Login",
    cancelText = "Cancel",
}: CreateNewPasswordPageProps) => {
    // Hook for programmatic navigation after successful password creation
    const navigate = useNavigate();

    // State to store form validation errors
    // Uses Record<string, string> to map field names to error messages
    const [errors, setErrors] = useState<Record<string, string>>({});

    /**
     * Form submission handler
     *
     * 1. Prevents default form submission
     * 2. Extracts form data using FormData API
     * 3. Validates passwords against Zod schema including confirmation matching
     * 4. Sets validation errors or proceeds with password creation
     *
     * @param e - Form submission event
     */
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default browser form submission

        // Extract form data using modern FormData API
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData) as Record<string, string>;

        // Validate form data against Zod schema
        const result = createPasswordSchema.safeParse(data);

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

        // Replace with API logic later
        console.log("New password data:", { password: data.newPassword });

        // Navigate to sign-in page after the password has been successfuly created
        navigate({ to: "/sign-in" });
    };

    return (
        <main className="bg-[#FAFAFA] rounded-[15px] m-2.5">
            {/* Centered container for the password creation form */}
            <section className="flex items-center justify-center min-h-[calc(100vh-90px)]">
                {/* Form card with consistent styling */}
                <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
                    {/* Conditional heading display based on props */}
                    {heading && (
                        <h1 className="mb-6 text-center text-xl font-semibold">{heading}</h1>
                    )}

                    {/* Form with noValidate to use custom validation instead of browser defaults */}
                    <form onSubmit={handleSubmit} noValidate>
                        {/* New password field with autocomplete hint for password managers */}
                        <FormField
                            id="newPassword"
                            label="New Password"
                            type="password"
                            placeholder="Password"
                            errors={errors}
                            autoComplete="new-password"
                        />

                        {/* Password confirmation field */}
                        <FormField
                            id="confirmPassword"
                            label="Confirm New Password"
                            type="password"
                            placeholder="Re-enter Password"
                            errors={errors}
                            autoComplete="new-password"
                        />

                        {/* Submit button with full width and consistent styling */}
                        <Button type="submit" className="w-full bg-black text-white cursor-pointer">
                            {buttonText}
                        </Button>
                    </form>

                    {/* Cancel link to return to sign-in without password change */}
                    <div className="mt-3 text-center">
                        <Link to="/sign-in">
                            <span className="text-sm text-gray-700 hover:underline cursor-pointer">
                                {cancelText}
                            </span>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
};

// export name
export { CreateNewPasswordPage };
