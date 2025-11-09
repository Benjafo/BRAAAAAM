import { Button } from "./ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
                "Please enter a 10 digit phone number."
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
type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * RegisterPage Component
 *
 * A reusable registration form component with comprehensive validation and customizable text content.
 * Features:
 * - Client-side form validation using Zod with React Hook Form
 * - Phone number validation for US formats
 * - Password confirmation matching
 *
 * @param props - RegisterProps object containing optional text customizations
 */
const RegisterPage = ({
    heading = "Register an Account",
    buttonText = "Register",
    loginText = "Login",
}: RegisterProps) => {
    // Hook for programmatic navigation after successful registration
    const navigate = useNavigate();

    // React Hook Form setup with Zod validation
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: "onBlur",
    });

    /**
     * Form submission handler
     * Called only when validation passes
     *
     * @param data - Validated form data
     */
    const onSubmit = async (data: RegisterFormData) => {
        try {
            console.log("Registration data:", {
                email: data.email,
                phone: data.phone,
                // don't log password for production
            });

            // API call would be here
            // await registerUser({
            //   email: data.email,
            //   phone: data.phone,
            //   password: data.password
            // });

            // Navigate to home page on successful registration
            navigate({ to: "/" });
        } catch (error) {
            console.error("Error registering user:", error);
            // Handle API errors here
        }
    };

    return (
        <main className="bg-[#FAFAFA] rounded-[15px] m-2.5">
            {/* Centered container for the registration form */}
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
                            label="Email"
                            type="email"
                            placeholder="user@example.com"
                            autoComplete="email"
                            register={register("email")}
                            error={errors.email}
                        />

                        {/* Phone number field with tel input type and mobile optimization */}
                        <FormField
                            id="phone"
                            label="Phone Number"
                            type="tel"
                            placeholder="(123) 456-7890"
                            autoComplete="tel"
                            register={register("phone")}
                            error={errors.phone}
                        />

                        {/* Password field with new-password autocomplete hint */}
                        <FormField
                            id="password"
                            label="Password"
                            type="password"
                            placeholder="Password"
                            autoComplete="new-password"
                            register={register("password")}
                            error={errors.password}
                        />

                        {/* Password confirmation field */}
                        <FormField
                            id="confirmPassword"
                            label="Re-enter Password"
                            type="password"
                            placeholder="Re-enter password"
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
                            {isSubmitting ? "Registering..." : buttonText}
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

export { RegisterPage };
