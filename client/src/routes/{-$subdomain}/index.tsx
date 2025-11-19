import { MainNavigation } from "@/components/Navigation";
import { authStore } from "@/components/stores/authStore";
import { createFileRoute, redirect } from "@tanstack/react-router";

// not sure we need a index here for main navigation? This could be moved elsewhere.
export const Route = createFileRoute("/{-$subdomain}/")({
    beforeLoad: async () => {
        const s = authStore.getState();
        const isAuthed = Boolean(s.user && s.accessToken);

        if (!isAuthed) {
            throw redirect({
                to: "/{-$subdomain}/sign-in",
            });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
        </>
    );
}
