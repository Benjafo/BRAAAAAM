import { MainNavigation } from "@/components/Navigation";
import { OrganizationsTable } from "@/components/tables/OrganizationsTable";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/organizations")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
            <OrganizationsTable />
        </>
    );
}
