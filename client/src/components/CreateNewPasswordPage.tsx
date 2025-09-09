import { Button } from "./ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

// TypeScript type inferred from the Zod schema
type CreatePasswordFormData = z.infer<typeof createPasswordSchema>;

/**
 * CreateNewPasswordPage Component
 *
 * A password creation form component for password reset flows with validation and customizable text content.
 * Features:
 * - Client-side password validation using Zod with React Hook Form
 * - Password strength requirements (minimum 8 characters)
 * - Password confirmation matching validation
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

    // React Hook Form setup with Zod validation
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CreatePasswordFormData>({
        resolver: zodResolver(createPasswordSchema),
        mode: "onBlur", // Validate on blur for better UX
    });

    /**
     * Form submission handler
     * Called only when validation passes
     *
     * @param data - Validated form data containing new password and confirmation
     */
    const onSubmit = async (data: CreatePasswordFormData) => {
        try {
            // Replace with actual API logic
            console.log("New password data:", { password: data.newPassword });

            // Add API call here
            // await createNewPassword(data.newPassword);

            // Navigate to sign-in page after successful password creation
            navigate({ to: "/sign-in" });
        } catch (error) {
            console.error("Error creating password:", error);
            // Handle API errors here
        }
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

                    {/* Form with React Hook Form handleSubmit */}
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* New password field with autocomplete hint for password managers */}
                        <FormField
                            id="newPassword"
                            label="New Password"
                            type="password"
                            placeholder="Password"
                            autoComplete="new-password"
                            register={register("newPassword")}
                            error={errors.newPassword}
                        />

                        {/* Password confirmation field */}
                        <FormField
                            id="confirmPassword"
                            label="Confirm New Password"
                            type="password"
                            placeholder="Re-enter Password"
                            autoComplete="new-password"
                            register={register("confirmPassword")}
                            error={errors.confirmPassword}
                        />

                        {/* Submit button with loading state */}
                        <Button
                            type="submit"
                            className="w-full bg-black text-white cursor-pointer disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Creating..." : buttonText}
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

export { CreateNewPasswordPage };
