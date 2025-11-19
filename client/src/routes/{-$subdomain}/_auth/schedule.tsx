import Schedule from "@/components/calendar/Schedule";
import { MainNavigation } from "@/components/Navigation";
import { authStore } from "@/components/stores/authStore";
import { RidesTable } from "@/components/tables/RidesTable";
import { PERMISSIONS } from "@/lib/permissions";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useState } from "react";

export const Route = createFileRoute("/{-$subdomain}/_auth/schedule")({
    beforeLoad: async ({ location }) => {
        const s = authStore.getState();
        const isAuthed = Boolean(s.user && s.accessToken);

        if (!isAuthed) {
            throw redirect({
                to: "/{-$subdomain}/sign-in",
                search: { redirect: location.pathname },
            });
        }

        if (!s.hasPermission(PERMISSIONS.OWN_APPOINTMENTS_READ) && !s.hasPermission(PERMISSIONS.ALL_APPOINTMENTS_READ)) {
            throw redirect({
                to: "/{-$subdomain}/dashboard",
            });
        }

        return { user: s.user, isAuthed };
    },
    component: RouteComponent,
});

function RouteComponent() {
    const [activeTab, setActiveTab] = useState("list");

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
                    <Schedule viewToggle={viewToggle} />
                ) : (
                    <RidesTable viewToggle={viewToggle} />
                )}
            </div>
        </>
    );
}
