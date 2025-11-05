import { MainNavigation } from "@/components/Navigation";
import { UsersTable } from "@/components/tables/UsersTable";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_auth/users")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
            <UsersTable />
        </>
    );
}
