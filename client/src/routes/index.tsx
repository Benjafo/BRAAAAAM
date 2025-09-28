import { MainNavigation } from "@/components/Navigation";
import { useAuthStore } from "@/components/stores/authStore";
import { createFileRoute, redirect } from "@tanstack/react-router";
import GoogleLocator from "@/components/ui/googleLocator";
import type { Location } from "@/lib/types";

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
    const handleLocationSelect = (location: Location | null) => {
        location;
    };
    return (
        <>
            <MainNavigation />
            <div className="max-w-md mx-auto mt-8 p-6">
                <h1 className="font-bold mb-4">Address</h1>

                <GoogleLocator
                    onLocationSelect={handleLocationSelect}
                    placeholder="Enter Address"
                    className="mb-4"
                />
            </div>
        </>
    );
}
