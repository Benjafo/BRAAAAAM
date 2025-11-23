import { ClientsTable } from "@/components/tables/ClientsTable";
import { MainNavigation } from "@/components/common/Navigation";
import { authStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_auth/clients")({
    beforeLoad: async () => {
        const s = authStore.getState();
        // const isAuthed = Boolean(s.user && s.accessToken);

        // if (!isAuthed) {
        //     throw redirect({
        //         to: "/{-$subdomain}/sign-in",
        //         search: { redirect: location.pathname },
        //     });
        // }

        if (!s.hasPermission(PERMISSIONS.CLIENTS_READ)) {
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
                <ClientsTable />
            </div>
        </>
    );
}
