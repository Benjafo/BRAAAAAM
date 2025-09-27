import { MainNavigation } from "@/components/Navigation";
import { useAuthStore } from "@/components/stores/authStore";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    beforeLoad: async () => {
        const { isAuthenticated } = useAuthStore.getState();

        if (isAuthenticated) {
            throw redirect({
                to: "/dashboard",
            });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <MainNavigation />;
}
