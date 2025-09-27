import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboard = () => {
    const stats = [
        { label: "Scheduled Rides", value: "13" },
        { label: "Unassigned Rides", value: "5" },
        { label: "Cancelled Rides", value: "7" },
        { label: "Completed Rides", value: "60" },
    ];

    const recentActivities = [
        {
            title: "Created client Timothy Sampson",
            time: "Aug 25, 2025 - 10:05 AM",
            user: "Audrey Buck",
        },
        {
            title: "Assigned driver John Camel to ride for client Gerald Hamilton",
            time: "Aug 26, 2025 - 2:35 PM",
            user: "Caren Scott",
        },
        {
            title: "Created ride for client Margaret Smith",
            time: "Aug 27, 2025 - 2:35 PM",
            user: "Deb Reilly",
        },
        {
            title: "Unassigned driver Bill Beef from ride for client Harold Hammer",
            time: "Aug 28, 2025 - 2:35 PM",
            user: "Joan Albany",
        },
        {
            title: "Updated organization settings for Webster Wasps",
            time: "Aug 29, 2025 - 2:35 PM",
            user: "Joan Albany",
        },
    ];

    const upcomingRides = [
        { time: "9:00 AM", status: "Unassigned", driver: null, color: "bg-yellow-400" },
        { time: "9:00 AM", status: "Assigned", driver: "John Doe", color: "bg-green-500" },
        { time: "10:30 AM", status: "Assigned", driver: "Sarah Smith", color: "bg-green-500" },
        { time: "11:00 AM", status: "Unassigned", driver: null, color: "bg-yellow-400" },
        { time: "2:00 PM", status: "Assigned", driver: "Mike Johnson", color: "bg-green-500" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <main className="p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-lg font-medium mb-4 text-gray-900">
                        Ride Stats this Month
                    </h2>
                    <div className="grid grid-cols-4 gap-4">
                        {stats.map((stat, index) => (
                            <Card key={index} className="bg-white border-gray-200 shadow-sm">
                                <CardContent className="p-6 h-16 flex flex-col justify-center">
                                    <div className="text-gray-600 text-sm mb-3">{stat.label}</div>
                                    <div className="text-4xl font-bold text-gray-900">
                                        {stat.value}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Card className="bg-white border-gray-200 shadow-sm mb-8">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-gray-900 text-lg font-medium">
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-200">
                            {recentActivities.map((activity, index) => (
                                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-gray-900 text-sm">
                                                {activity.title}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">
                                                {activity.time}
                                            </p>
                                        </div>
                                        <span className="text-gray-600 text-xs">
                                            {activity.user}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-200">
                            <button className="text-blue-600 text-sm hover:text-blue-700 transition-colors">
                                View All
                            </button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-gray-900 text-lg font-medium">
                            Upcoming Rides
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-200">
                            {upcomingRides.map((ride, index) => (
                                <div key={index} className="p-4 grid grid-cols-3 items-center">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full ${ride.color}`}></div>
                                        <span className="text-gray-900 text-sm">{ride.time}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-gray-600 text-sm">
                                            {ride.driver || ride.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        {ride.status === "Unassigned" ? (
                                            <Button
                                                variant="link"
                                                className="text-blue-600 hover:text-blue-700 p-0 h-auto text-sm font-normal"
                                            >
                                                Assign Driver
                                            </Button>
                                        ) : (
                                            <span className="text-gray-600 text-sm">Assigned</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-200">
                            <button className="text-blue-600 text-sm hover:text-blue-700 transition-colors">
                                View All
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminDashboard;
