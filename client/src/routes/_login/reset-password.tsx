import { createFileRoute } from "@tanstack/react-router";
import { RequestPasswordResetPage } from "@/components/RequestPasswordResetPage";

export const Route = createFileRoute("/_login/reset-password")({
    component: ResetPasswordComponent,
});

function ResetPasswordComponent() {
    return <RequestPasswordResetPage />;
}
