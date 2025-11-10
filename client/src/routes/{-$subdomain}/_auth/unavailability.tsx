import { UnavailabilityTable } from "@/components/tables/UnavailabilityTable";
import { MainNavigation } from "@/components/Navigation";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_auth/unavailability")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
            <div className="container mx-auto py-6">
                <UnavailabilityTable />
            </div>
        </>
    );
}
