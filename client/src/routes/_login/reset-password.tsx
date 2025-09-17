import { createFileRoute } from "@tanstack/react-router";
import ResetPasswordForm from "@/components/form/ResetPasswordForm";

export const Route = createFileRoute("/_login/reset-password")({
    component: RouteComponent,
});

function RouteComponent() {

    return (
        <>
            <h1 className="mb-6 text-center text-xl font-semibold">Create a new password</h1>
            <ResetPasswordForm />
        </>
    )
}
