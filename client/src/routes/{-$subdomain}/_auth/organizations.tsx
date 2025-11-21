import { MainNavigation } from "@/components/Navigation";
import { OrganizationsTable } from "@/components/tables/OrganizationsTable";
import { authStore } from "@/components/stores/authStore";
// import { PERMISSIONS } from "@/lib/permissions";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_auth/organizations")({
    beforeLoad: async ({ location }) => {
        const s = authStore.getState();
        // const isAuthed = Boolean(s.user && s.accessToken);

        /**@TODO Figure out how to harden security here */
        if (s.subdomain) {
            throw redirect({
                to: "/{-$subdomain}/sign-in",
                search: { redirect: location.pathname },
            });
        }

        /**
         * @TODO REMOVE/REFACTOR
         * PERMISSIONS ARE NOT USED FOR SYSTEM ADMIN, ONLY FOR ORGANIZATION USERS 
         * */

        // if (!s.hasPermission(PERMISSIONS.ORGANIZATIONS_READ)) {
        //     throw redirect({
        //         to: "/{-$subdomain}/dashboard",
        //     });
        // }

        return { user: s.user };
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
            <hr/>
            <div className="w-full px-2.5 py-6">
                {/* <h3 className="text-3xl font-bold mb-5">Organizations</h3> */}
                <OrganizationsTable />
            </div>
        </>
    );
}
