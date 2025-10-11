import { ClientsTable } from "@/components/ClientsTable";
import { MainNavigation } from "@/components/Navigation";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/clients")({
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
