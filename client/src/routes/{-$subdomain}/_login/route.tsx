import { LoginNavigation } from "@/components/Navigation";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_login")({
    component: RouteComponent,
});

/**
 * Show LoginNavigation with Cancel button on all pages except /sign-in, which has the Cancel button hidden.
 * @returns JSX.Element
 */
function RouteComponent() {

    const location = useLocation();
    const showCancelButton = !location.pathname.endsWith('/sign-in');

    return (
        <div className="h-dvh p-[10px] overflow-hidden box-border flex flex-col gap-[10px]">
            <LoginNavigation showCancelButton={showCancelButton} />
            <div className="bg-neutral-50 rounded-xl p-[10px] flex items-center justify-center h-full">
                <div className="max-w-sm w-full rounded-2xl border p-8 bg-white shadow-sm">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}