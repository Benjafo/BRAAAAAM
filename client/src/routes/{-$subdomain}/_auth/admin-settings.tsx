import type { AdminGeneralFormRef } from "@/components/form/AdminGeneralForm";
import AdminGeneralForm from "@/components/form/AdminGeneralForm";
import { MainNavigation } from "@/components/Navigation";
import { AuditLogTable } from "@/components/tables/AuditLogTable";
import CustomFormsTable from "@/components/tables/CustomFormsTable";
import { LocationsTable } from "@/components/tables/LocationsTable";
import { RolesTable } from "@/components/tables/RolesTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";

export const Route = createFileRoute("/{-$subdomain}/_auth/admin-settings")({
    beforeLoad: async () => {
        const s = authStore.getState();

        if (!s.hasPermission(PERMISSIONS.SETTINGS_READ)) {
            throw redirect({
                to: "/{-$subdomain}/dashboard",
            });
        }

        return { user: s.user };
    },
    component: RouteComponent,
});

function RouteComponent() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const formRef = useRef<AdminGeneralFormRef>(null);

    const handleCancel = useCallback(() => {
        formRef.current?.handleCancel();
        setIsEditMode(false);
    }, []);

    const handleEditOrSave = useCallback(async () => {
        if (isEditMode) {
            setIsSubmitting(true);
            try {
                const success = await formRef.current?.handleSave();
                if (success) {
                    setIsEditMode(false);
                }
            } catch (error) {
                console.error("Save failed:", error);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            setIsEditMode(true);
        }
    }, [isEditMode]);

    const handleTabChange = useCallback(
        (value: string) => {
            // Exit edit mode when switching tabs, help from AI on this
            if (isEditMode) {
                formRef.current?.handleCancel();
                setIsEditMode(false);
            }
            setActiveTab(value);
        },
        [isEditMode]
    );

    // Dummy button text for other tabs for now
    const tabButtonText: Record<string, string> = {
        roles: "New Role",
        "audit-log": "Export",
        locations: "New Alias",
    };

    return (
        <>
            <MainNavigation />
            <div className="w-full px-2.5">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <div className="relative flex items-center justify-between mb-[15px] pt-2.5">
                        <TabsList>
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="forms">Forms</TabsTrigger>
                            <TabsTrigger value="roles">Roles</TabsTrigger>
                            <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
                            <TabsTrigger value="locations">Locations</TabsTrigger>
                        </TabsList>

                        <div className="flex justify-end gap-2">
                            {activeTab === "general" ? (
                                <>
                                    {/* Making it variant link so it follows the look of cancel button on sign in pages, not sure if we want it to look like a regular button instead */}
                                    {isEditMode && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={handleCancel}
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={handleEditOrSave}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting
                                            ? "Saving..."
                                            : isEditMode
                                              ? "Save Changes"
                                              : "Edit Page"}
                                    </Button>
                                </>
                            ) : (
                                tabButtonText[activeTab] && (
                                    <Button variant="outline" onClick={() => {}}>
                                        {tabButtonText[activeTab]}
                                    </Button>
                                )
                            )}
                        </div>
                    </div>

                    <TabsContent value="general">
                        <AdminGeneralForm ref={formRef} isEditMode={isEditMode} />
                    </TabsContent>

                    <TabsContent value="forms">
                        <CustomFormsTable />
                    </TabsContent>

                    <TabsContent value="roles">
                        <RolesTable />
                    </TabsContent>

                    <TabsContent value="audit-log">
                        <AuditLogTable />
                    </TabsContent>

                    <TabsContent value="locations">
                        <LocationsTable />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
