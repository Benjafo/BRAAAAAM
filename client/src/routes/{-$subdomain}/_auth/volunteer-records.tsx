import { MainNavigation } from "@/components/Navigation";
import { authStore } from "@/components/stores/authStore";
import { VolunteerRecordsTable } from "@/components/tables/VolunteerRecordsTable";
import { PERMISSIONS } from "@/lib/permissions";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_auth/volunteer-records")({
    beforeLoad: async () => {
        const s = authStore.getState();
        // const isAuthed = Boolean(s.user && s.accessToken);

        // if (!isAuthed) {
        //     throw redirect({
        //         to: "/{-$subdomain}/sign-in",
        //         search: { redirect: location.pathname },
        //     });
        // }

        const hasPermission =
            s.hasPermission(PERMISSIONS.OWN_VOLUNTEER_RECORDS_READ) ||
            s.hasPermission(PERMISSIONS.ALL_VOLUNTEER_RECORDS_READ);

        if (!hasPermission) {
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
                <VolunteerRecordsTable />
            </div>
        </>
    );
}
