import { createFileRoute } from "@tanstack/react-router";
import ResetPasswordForm from "@/components/form/ResetPasswordForm";
import z from "zod";

const resetPasswordSearchSchema = z.object({
    token: z.string(),
    id: z.string(),
});

export const Route = createFileRoute("/{-$subdomain}/_login/reset-password")({
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
