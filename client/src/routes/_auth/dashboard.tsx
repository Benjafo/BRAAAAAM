import AdminDashboard from "@/components/AdminDashboardPage";
import { MainNavigation } from "@/components/Navigation";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/dashboard")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
            <AdminDashboard />
        </>
    );
}
