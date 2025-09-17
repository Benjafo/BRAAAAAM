import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

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

// Props for individual form fields
type FieldProps = {
    readonly label: string;
    readonly placeholder: string;
}

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

    // Hook for programmatic navigation after successful sign-in
    const navigate = useNavigate()

    // React Hook Form setup with Zod validation
    const form = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "onBlur",
    })

    /**
     * Form submission handler
     * @param values - Form data of type SignInFormData
     */
    async function onSubmit(values: SignInFormData) {

        // Debug log form values in development mode
        if(import.meta.env.DEV) {
            console.log('SignInForm onSubmit values', values);
        }

        try {

            /**
             * @TODO
             * Implement ky fetch to api and handle form data
             * On success, navigate to page dependent by role/permissions returned
            */

            navigate({to: '/'})

        } catch( error ) {

            if(import.meta.env.DEV) {
                console.error('SignInForm onSubmit error', error);
            }

            // Show error toast notification
            toast.error('Failed to sign in. Please try again.')
        }
        
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{email.label}</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder={email.placeholder}
                                    {...field}
                                />
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
                <Button type="submit" className="w-full">{submitButtonText}</Button>
            </form>
        </Form>
    )
}

export default SignInForm;