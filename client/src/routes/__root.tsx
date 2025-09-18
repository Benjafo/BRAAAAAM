import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => (
    <AuthProvider>
        <div className="bg-neutral-100 dark:bg-black">
            <Outlet />
            <Toaster />
            <TanStackRouterDevtools />
        </div>
    </AuthProvider>
);

export const Route = createRootRoute({ component: RootLayout });
