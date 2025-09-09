import { Button } from "./ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
type SignInFormData = z.infer<typeof signInSchema>;

/**
 * SignInPage Component
 *
 * A reusable sign-in form component with validation and customizable text content.
 * Features:
 * - Client-side form validation using Zod with React Hook Form
 * - Accessible form structure with labels and error messages
 * - Loading states and proper error handling
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

    // React Hook Form setup with Zod validation
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        mode: "onBlur", // Validate on blur for better UX
    });

    /**
     * Form submission handler
     * Called only when validation passes
     *
     * @param data - Validated form data
     */
    const onSubmit = async (data: SignInFormData) => {
        try {
            console.log("Sign in data:", {
                email: data.email,
                // Don't log password for production
            });

            // Add API call here
            // await signInUser({
            //   email: data.email,
            //   password: data.password
            // });

            // Navigate to home page/dashboard on successful sign-in
            navigate({ to: "/" });
        } catch (error) {
            console.error("Error signing in:", error);
            // Handle API errors here
        }
    };

    return (
        <main className="bg-[#FAFAFA] rounded-[15px] m-2.5">
            {/* Centered container for the sign-in form */}
            <section className="flex items-center justify-center min-h-[calc(100vh-90px)]">
                {/* Form card with consistent styling */}
                <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
                    {/* Dynamic heading based on props */}
                    <h1 className="mb-6 text-center text-xl font-semibold">{heading}</h1>

                    {/* Form with React Hook Form handleSubmit */}
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Email field with proper autocomplete for password managers */}
                        <FormField
                            id="email"
                            label="User"
                            type="email"
                            placeholder="user@example.com"
                            autoComplete="email"
                            register={register("email")}
                            error={errors.email}
                        />

                        {/* Password field with current-password autocomplete hint */}
                        <FormField
                            id="password"
                            label="Password"
                            type="password"
                            placeholder="Password"
                            autoComplete="current-password"
                            register={register("password")}
                            error={errors.password}
                        />

                        {/* Submit button with loading state */}
                        <Button
                            type="submit"
                            className="w-full bg-black text-white cursor-pointer disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Signing in..." : buttonText}
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

export { SignInPage };
