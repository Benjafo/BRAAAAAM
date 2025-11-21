import AdminDashboard from "@/components/AdminDashboardPage";
import { MainNavigation } from "@/components/Navigation";
import { authStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_auth/dashboard")({
    // beforeLoad: async () => {
    //     const s = authStore.getState();
    //     // const isAuthed = Boolean(s.user && s.accessToken);

    //     // if (!isAuthed) {
    //     //     throw redirect({
    //     //         to: "/{-$subdomain}/sign-in",
    //     //         search: { redirect: location.pathname },
    //     //     });
    //     // }

    //     if (!s.hasPermission(PERMISSIONS.DASHBOARD_READ)) {
    //         throw redirect({
    //             to: "/{-$subdomain}/schedule",
    //         });
    //     }

    //     return { user: s.user };
    // },
    component: RouteComponent,
});

function RouteComponent() {

    const s = authStore.getState()

    return (
        <div className="">
            <MainNavigation />
            {s.hasPermission(PERMISSIONS.DASHBOARD_READ) ? (
                <AdminDashboard />
            ) : (
                <div className="m-4">
                    <div className="text-3xl font-bold mb-2">Welcome, {s.user?.firstName} {s.user?.lastName}!</div>
                    <p>Nothing to display on your dashboard.</p>
                </div>
            )}
            {/* <AdminDashboard /> */}
        </div>
    );
}
