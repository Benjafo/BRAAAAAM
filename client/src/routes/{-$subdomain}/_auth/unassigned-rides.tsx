import UnassignedRides from "@/components/calendar/UnassignedRides";
import { MainNavigation } from "@/components/common/Navigation";
import { RidesTable } from "@/components/tables/RidesTable";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

export const Route = createFileRoute("/{-$subdomain}/_auth/unassigned-rides")({
    component: RouteComponent,
});

function RouteComponent() {
    const [activeTab, setActiveTab] = useState("calendar");

    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value);
    }, []);

    const viewToggle = {
        activeView: activeTab,
        onChange: handleTabChange,
    };

    return (
        <>
            <MainNavigation />
            <div className="w-full px-2.5 py-6">
                {activeTab === "calendar" ? (
                    <UnassignedRides viewToggle={viewToggle} />
                ) : (
                    <RidesTable isUnassignedRidesOnly={true} hideActionButton={true} viewToggle={viewToggle} />
                )}
            </div>
        </>
    );
}
