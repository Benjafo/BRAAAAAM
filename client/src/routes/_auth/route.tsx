import { authStore } from "@/components/stores/authStore";
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
    beforeLoad: async ({ location }) => {
        // Get auth state from Zustand store
        const s = authStore.getState();
        const user = s.user
        const isAuthed = Boolean(s.user && s.accessToken)

        // Check if user is authenticated
        if (!isAuthed) {
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
            isAuthed,
        };
    },
    component: AuthLayout,
});

function AuthLayout() {
    return <Outlet />;
}
