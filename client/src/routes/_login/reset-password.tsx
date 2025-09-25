import { createFileRoute } from "@tanstack/react-router";
import ResetPasswordForm from "@/components/form/ResetPasswordForm";
import z from "zod";

export const resetPasswordSearchSchema = z.object({
    token: z.string(),
});

export const Route = createFileRoute("/_login/reset-password")({
    component: RouteComponent,
    validateSearch: resetPasswordSearchSchema.parse,
});
function RouteComponent() {
    return (
        <>
            <h1 className="mb-6 text-center text-xl font-semibold">Create a new password</h1>
            <ResetPasswordForm />
        </>
    );
}
