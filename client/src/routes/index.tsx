import { MainNavigation } from "@/components/Navigation";
import { authStore } from "@/components/stores/authStore";
import { createFileRoute, redirect } from "@tanstack/react-router";

// not sure we need a index here for main navigation? This could be moved elsewhere.
export const Route = createFileRoute("/")({
    beforeLoad: async () => {
        const s = authStore.getState();
        const isAuthed = Boolean(s.user && s.accessToken);

        if (isAuthed) {
            throw redirect({
                to: "/dashboard",
            });
        } else {
            throw redirect({
                to: "/sign-in",
            });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
            <div className="max-w-md mx-auto mt-8 p-6">
                <h1 className="font-bold mb-4">Address</h1>
            </div>
        </>
    );
}
