import { Toaster } from "@/components/ui/sonner";

import { createRootRoute, Outlet } from "@tanstack/react-router";

const RootLayout = () => (
    <div className="min-h-screen bg-background">
        <Outlet />
        <Toaster />
        {/* <TanStackRouterDevtools /> */}
    </div>
);

export const Route = createRootRoute({ component: RootLayout });
