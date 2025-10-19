import Schedule from "@/components/calendar/Schedule";
import { MainNavigation } from "@/components/Navigation";
import { RidesTable } from "@/components/tables/RidesTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

export const Route = createFileRoute("/schedule")({
    component: RouteComponent,
});

function RouteComponent() {
    const [activeTab, setActiveTab] = useState("calendar");

    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value);
    }, []);

    return (
        <>
            <MainNavigation />
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="relative flex items-center justify-between mb-[15px] pt-2.5">
                    <TabsList>
                        <TabsTrigger value="calendar">
                            <Button variant="outline">Calendar</Button>
                        </TabsTrigger>
                        <TabsTrigger value="list">
                            <Button variant="outline">List</Button>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="calendar">
                    <Schedule />
                </TabsContent>
                <TabsContent value="list">
                    <RidesTable />
                </TabsContent>
            </Tabs>
        </>
    );
}
