import { Toaster } from "@/components/ui/sonner";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => (
    <div className="bg-neutral-100 dark:bg-black">
        <Outlet />
        <Toaster />
        <TanStackRouterDevtools />
    </div>
);

export const Route = createRootRoute({ component: RootLayout });
