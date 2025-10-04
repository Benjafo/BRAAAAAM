import { z } from "zod";

/**
 * Zod schema for password reset form validation
 * Simple email validation for reset requests
 */
export const requestPasswordResetSchema = z.object({
    email: z.email("Please enter a valid email address."),
});

/**
 * Zod schema for password creation validation
 * Validates password requirements and confirmation matching
 */
export const createPasswordSchema = z
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
 * Zod schema for form validation
 * Validates email format and password requirements
 */
export const signInSchema = z.object({
    email: z.email("Please enter a valid email address."),
    password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters long"),
});
