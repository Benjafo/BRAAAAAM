import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect } from "react";
import { useLogin } from "@/hooks/useAuth";
import { useIsAuthed } from "../stores/authStore";

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
    const navigate = useNavigate();

    const login = useLogin();
    const isAuthed = useIsAuthed();
    const form = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "onBlur",
    });

    useEffect(() => {
        if(isAuthed) navigate({to: '/{-$subdomain}'});
    }, [isAuthed, navigate])

    // Effect: Handle successful authentication by redirecting user
    // // Note: Both admin and regular users redirect to "/", we will change this later when we have the routing properly developed
    // useEffect(() => {
    //     if (user && isAuthenticated) {
    //         const redirectTo = user.role === "admin" ? "/" : "/";
    //         navigate({ to: redirectTo });
    //     }
    // }, [user, isAuthenticated, navigate]);

    async function onSubmit({ email, password }: SignInFormData) {
        if (import.meta.env.DEV) {
            console.log("SignInForm onSubmit values", email, password);
        }

        login.mutate({ email, password }, {
            onSuccess: () => {
                toast.success('Welcome back!')
            },
            onError: (error) => {
                toast.error(error.message)
            }
        })
    }

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                    <Button type="submit" className="w-full" disabled={login.isPending}>
                        {login.isPending ? "Signing In..." : submitButtonText}
                    </Button>
                </form>
            </Form>
        </div>
    );
}

export default SignInForm;
