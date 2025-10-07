import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
        <div className="min-h-screen bg-background text-foreground">
            <main className="p-[10px] mx-auto">
                <div className="mb-8">
                    {/* <h2 className="text-lg font-medium mb-4">
                        Ride Stats this Month
                    </h2> */}
                    <div className="grid grid-cols-4 gap-4">
                        {stats.map((stat, index) => (
                            <Card key={index} className="bg-card text-card-foreground">
                                <CardContent className="p-6 h-16 flex flex-col justify-center">
                                    <div className="text-sm mb-3">{stat.label}</div>
                                    <div className="text-4xl font-bold">
                                        {stat.value}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Card className="bg-card text-card-foreground mb-8">
                    <CardHeader className="">
                        <CardTitle className="text-lg font-medium">
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 border-y">
                        <div className="divide-y">
                            {recentActivities.map((activity, index) => (
                                <div key={index} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                {activity.title}
                                            </p>
                                            <p className="text-xs mt-1">
                                                {activity.time}
                                            </p>
                                        </div>
                                        <span className="text-xs">
                                            {activity.user}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className='justify-center'>
                            <Button variant={'link'}>View All</Button>
                    </CardFooter>
                </Card>

                <Card className="">
                    <CardHeader className="">
                        <CardTitle className="text-lg font-medium">
                            Upcoming Rides
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 border-y">
                        <div className="divide-y">
                            {upcomingRides.map((ride, index) => (
                                <div key={index} className="p-4 grid grid-cols-3 items-center">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full ${ride.color}`}></div>
                                        <span className="text-sm">{ride.time}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm">
                                            {ride.driver || ride.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        {ride.status === "Unassigned" ? (
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto text-sm font-normal"
                                            >
                                                Assign Driver
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto text-sm font-normal"
                                                disabled
                                            >
                                                Assigned
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className='justify-center'>
                        <Button variant={'link'}>View All</Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
};

export default AdminDashboard;
