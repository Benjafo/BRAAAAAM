import { MainNavigation } from "@/components/Navigation";
import { UsersTable } from "@/components/UsersTable";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users")({
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
