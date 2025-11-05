import { ClientsTable } from "@/components/tables/ClientsTable";
import { MainNavigation } from "@/components/Navigation";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_auth/clients")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
            <ClientsTable />
        </>
    );
}
