import z from "zod";

export const signInSchema = z.object({
    email: z.email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const requestPasswordResetSchema = z.object({
    email: z.email("Please enter a valid email address."),
});

export const createPasswordSchema = z
    .object({
        newPassword: z.string().min(8, "Password must be at least 8 characters long."),
        confirmNewPassword: z.string().nonempty("Please confirm your password."),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"], // Attach error to confirmPassword field
    });
