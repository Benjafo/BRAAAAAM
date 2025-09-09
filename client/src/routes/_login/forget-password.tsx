import { CreateNewPasswordPage } from "@/components/CreateNewPasswordPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_login/forget-password")({
    component: ForgetPasswordComponent,
});

function ForgetPasswordComponent() {
    return <CreateNewPasswordPage />;
}
