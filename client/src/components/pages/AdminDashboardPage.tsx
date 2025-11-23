import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { http } from "@/services/auth/serviceResolver";
import type { DashboardData } from "@/types/org/dashboard";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const AdminDashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await http.get("o/dashboard").json<DashboardData>();
                setData(response);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive">{error || "Failed to load dashboard"}</p>
                </div>
            </div>
        );
    }

    const stats = [
        { label: "Scheduled Rides", value: data.stats.scheduledRides.toString() },
        { label: "Unassigned Rides", value: data.stats.unassignedRides.toString() },
        { label: "Cancelled Rides", value: data.stats.cancelledRides.toString() },
        { label: "Completed Rides", value: data.stats.completedRides.toString() },
    ];

    const formatActivityTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="p-[10px] mx-auto">
                <div className="mb-8">
                    <h2 className="text-lg font-medium mb-4">Monthly Ride Stats</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {stats.map((stat, index) => (
                            <Card key={index} className="bg-card text-card-foreground">
                                <CardContent className="p-6 h-16 flex flex-col justify-center">
                                    <div className="text-sm mb-3">{stat.label}</div>
                                    <div className="text-4xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Card className="bg-card text-card-foreground mb-8">
                    <CardHeader className="">
                        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 border-t">
                        <div className="divide-y">
                            {data.recentActivity.length > 0 ? (
                                data.recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatActivityTime(activity.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-muted-foreground">
                                    No recent activity
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="">
                    <CardHeader className="">
                        <CardTitle className="text-lg font-medium">Upcoming Rides</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 border-t">
                        <div className="divide-y">
                            {data.upcomingRides.length > 0 ? (
                                data.upcomingRides.map((ride) => {
                                    const isUnassigned = ride.status === "Unassigned";
                                    const clientName =
                                        `${ride.clientFirstName || ""} ${ride.clientLastName || ""}`.trim();
                                    const driverName =
                                        ride.driverFirstName && ride.driverLastName
                                            ? `${ride.driverFirstName} ${ride.driverLastName}`
                                            : null;

                                    return (
                                        <div
                                            key={ride.id}
                                            className="p-4 grid grid-cols-[auto_1fr_auto] gap-4 items-center"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${isUnassigned ? "bg-yellow-400" : "bg-green-500"}`}
                                                ></div>
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {ride.date}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {ride.time}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm">{clientName}</div>
                                                {ride.destinationAddressLine1 && (
                                                    <div className="text-xs text-muted-foreground">
                                                        → {ride.destinationAddressLine1}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right text-sm">
                                                {driverName || (
                                                    <span className="text-muted-foreground">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-muted-foreground">
                                    No upcoming rides
                                </div>
                            )}
                        </div>
                        <div className="p-2 text-center border-t">
                            <Link
                                to="/{-$subdomain}/schedule"
                                className="text-sm text-primary hover:underline"
                            >
                                View All
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminDashboard;
