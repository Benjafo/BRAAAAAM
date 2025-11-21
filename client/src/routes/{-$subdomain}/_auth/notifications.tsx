import { MainNavigation } from "@/components/Navigation";
import { NotificationsTable } from "@/components/tables/NotificationsTable";
import { authStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_auth/notifications")({
    beforeLoad: async () => {
        const s = authStore.getState();
        // const isAuthed = Boolean(s.user && s.accessToken);

        // if (!isAuthed) {
        //     throw redirect({
        //         to: "/{-$subdomain}/sign-in",
        //         search: { redirect: location.pathname },
        //     });
        // }

        // Check if user has either own notifications or all notifications permission
        const hasOwnNotifications = s.hasPermission(PERMISSIONS.OWN_NOTIFICATIONS_READ);
        const hasAllNotifications = s.hasPermission(PERMISSIONS.ALL_NOTIFICATIONS_READ);

        if (!hasOwnNotifications && !hasAllNotifications) {
            throw redirect({
                to: "/{-$subdomain}/dashboard",
            });
        }

        return { user: s.user };
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
            <div className="w-full px-2.5 py-6">
                <NotificationsTable />
            </div>
        </>
    );
}
