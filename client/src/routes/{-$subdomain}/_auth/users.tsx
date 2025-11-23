import { MainNavigation } from "@/components/common/Navigation";
import { UsersTable } from "@/components/tables/UsersTable";
import { authStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_auth/users")({
    beforeLoad: async () => {
        const s = authStore.getState();
        // const isAuthed = Boolean(s.user && s.accessToken);

        // if (!isAuthed) {
        //     throw redirect({
        //         to: "/{-$subdomain}/sign-in",
        //         search: { redirect: location.pathname },
        //     });
        // }

        if (!s.hasPermission(PERMISSIONS.USERS_READ)) {
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
                <UsersTable />
            </div>
        </>
    );
}
