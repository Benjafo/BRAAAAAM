import Unavailability from "@/components/calendar/Unavailability";
import { MainNavigation } from "@/components/Navigation";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/unavailability")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
            <Unavailability />
        </>
    );
}
