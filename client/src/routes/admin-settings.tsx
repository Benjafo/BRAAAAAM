import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AdminGeneralForm from "@/components/form/AdminGeneralForm";
import type { AdminGeneralFormRef } from "@/components/form/AdminGeneralForm";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef } from "react";

export const Route = createFileRoute("/admin-settings")({
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
            // Exit edit mode when switching tabs
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
        forms: "Edit Text",
        roles: "New Role",
        "audit-log": "Export",
        locations: "New Alias",
    };

    return (
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
                            <Button variant="outline" onClick={() => {}}>
                                {tabButtonText[activeTab]}
                            </Button>
                        )}
                    </div>
                </div>

                <TabsContent value="general">
                    <AdminGeneralForm ref={formRef} isEditMode={isEditMode} />
                </TabsContent>

                <TabsContent value="forms">
                    <p className="text-muted-foreground">{/* Forms content */}</p>
                </TabsContent>

                <TabsContent value="roles">
                    <p className="text-muted-foreground">{/* Roles content */}</p>
                </TabsContent>

                <TabsContent value="audit-log">
                    <p className="text-muted-foreground">{/* Audit log content */}</p>
                </TabsContent>

                <TabsContent value="locations">
                    <p className="text-muted-foreground">{/* Locations content */}</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}
