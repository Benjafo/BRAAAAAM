import AdminDashboard from "@/components/AdminDashboardPage";
import { MainNavigation } from "@/components/Navigation";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_auth/dashboard")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className=''>
            <MainNavigation />
            <AdminDashboard />
        </div>
    );
}
