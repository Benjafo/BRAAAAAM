interface DashboardStats {
    scheduledRides: number;
    unassignedRides: number;
    cancelledRides: number;
    completedRides: number;
}

interface Activity {
    id: string;
    type: string;
    description: string;
    timestamp: string;
}

interface UpcomingRide {
    id: string;
    date: string;
    time: string;
    status: string;
    clientFirstName: string | null;
    clientLastName: string | null;
    driverFirstName: string | null;
    driverLastName: string | null;
    pickupAddressLine1: string | null;
    destinationAddressLine1: string | null;
}

export interface DashboardData {
    stats: DashboardStats;
    recentActivity: Activity[];
    upcomingRides: UpcomingRide[];
}
