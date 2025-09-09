import { RegisterPage } from "@/components/RegisterPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_login/register")({
    component: RouteComponent,
});

function RouteComponent() {
    return <RegisterPage />;
}
