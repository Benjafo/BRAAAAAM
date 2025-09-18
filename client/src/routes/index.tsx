import { createFileRoute } from "@tanstack/react-router";
import { MainNavigation } from "@/components/Navigation";

export const Route = createFileRoute("/")({
    component: RouteComponent,
});

function RouteComponent() {
    return <MainNavigation />;
}
