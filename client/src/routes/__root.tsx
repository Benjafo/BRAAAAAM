import { Toaster } from "@/components/ui/sonner";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { SecondaryNavigation } from "@/components/Navigation";

const RootLayout = () => (
    <div className="bg-neutral-100 dark:bg-black">
        <SecondaryNavigation />
        <Outlet />
        <Toaster />
        <TanStackRouterDevtools />
    </div>
);

export const Route = createRootRoute({ component: RootLayout });
