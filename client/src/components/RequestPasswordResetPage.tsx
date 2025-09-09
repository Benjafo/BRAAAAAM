import { Button } from "./ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
type RequestPasswordResetFormData = z.infer<typeof requestPasswordResetSchema>;

/**
 * RequestPasswordResetPage Component
 *
 * A password reset request form component with email validation and customizable text content.
 * Features:
 * - Client-side email validation using Zod with React Hook Form
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

    // React Hook Form setup with Zod validation
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RequestPasswordResetFormData>({
        resolver: zodResolver(requestPasswordResetSchema),
        mode: "onBlur", // Validate on blur for better UX
    });

    /**
     * Form submission handler
     * Called only when validation passes
     *
     * @param data - Validated form data
     */
    const onSubmit = async (data: RequestPasswordResetFormData) => {
        try {
            console.log("Password reset request data:", data);

            // Add API call here
            // await requestPasswordReset(data.email);

            // Navigate to homepage/dashboard(?)
            navigate({ to: "/" });
        } catch (error) {
            console.error("Error requesting password reset:", error);
            // Handle API errors here
        }
    };

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

                    {/* Form with React Hook Form handleSubmit */}
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Email field with proper autocomplete for password managers */}
                        <FormField
                            id="email"
                            label="Email Address"
                            type="email"
                            placeholder="user@example.com"
                            autoComplete="email"
                            register={register("email")}
                            error={errors.email}
                        />

                        {/* Submit button with loading state */}
                        <Button
                            type="submit"
                            className="w-full bg-black text-white cursor-pointer disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Sending..." : buttonText}
                        </Button>
                    </form>

                    {/* Help/support link for users who need assistance */}
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

export { RequestPasswordResetPage };
