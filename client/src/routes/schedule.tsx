import { MainNavigation } from "@/components/Navigation";
import { RidesTable } from "@/components/RidesTable";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/schedule")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
            <RidesTable />
        </>
    );
}
