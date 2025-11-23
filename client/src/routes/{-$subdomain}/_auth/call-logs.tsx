import { CallLogsTable } from "@/components/tables/CallLogsTable";
import { MainNavigation } from "@/components/common/Navigation";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_auth/call-logs")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MainNavigation />
            <div className="w-full px-2.5 py-6">
                <CallLogsTable />
            </div>
        </>
    );
}
