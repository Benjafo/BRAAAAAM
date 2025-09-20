import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { useAuthStore } from "@/components/stores/authStore";

export const Route = createFileRoute("/_auth")({
    beforeLoad: async ({ location }) => {
        // Get auth state from Zustand store
        const { isAuthenticated, user } = useAuthStore.getState();

        // Check if user is authenticated
        if (!isAuthenticated || !user) {
            throw redirect({
                to: "/sign-in",
                search: {
                    redirect: location.pathname,
                },
            });
        }

        // Return user data to be available in route context
        return {
            user,
            isAuthenticated,
        };
    },
    component: AuthLayout,
});

function AuthLayout() {
    return <Outlet />;
}
