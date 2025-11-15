export interface MatchingContext {
    appointment: AppointmentDetails;
    client: ClientDetails;
    unavailabilityMap: Map<string, UnavailabilityBlock[]>;
    weekRidesMap: Map<string, number>;
    concurrentRidesSet: Set<string>;
    allDriversWeekRides: Array<{ driverId: string; rideCount: number }>;
}

export interface AppointmentDetails {
    id: string;
    startDate: string;
    startTime: string;
    estimatedDurationMinutes: number | null;
    hasAdditionalRider: boolean | null;
    destinationLocation: {
        city: string;
        state: string;
    };
}

export interface ClientDetails {
    mobilityEquipment: string[] | null;
    vehicleTypes: string[] | null;
    hasOxygen: boolean | null;
    hasServiceAnimal: boolean | null;
}

export interface DriverProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    canAccommodateMobilityEquipment: string[] | null;
    vehicleType: string | null;
    canAccommodateOxygen: boolean | null;
    canAccommodateServiceAnimal: boolean | null;
    canAccommodateAdditionalRider: boolean | null;
    maxRidesPerWeek: number | null;
}

export interface ScoreBreakdown {
    total: number;
    baseScore: {
        loadBalancing: number;
        vehicleMatch: number;
        mobilityEquipment: number;
        specialAccommodations: number;
    };
    penalties: {
        unavailable: number;
        concurrentRide: number;
        overMaxRides: number;
    };
    warnings: {
        hasUnavailability: boolean;
        hasConcurrentRide: boolean;
        isOverMaxRides: boolean;
        hasVehicleMismatch: boolean;
    };
}

export interface ScoredDriver extends DriverProfile {
    matchScore: number;
    matchReasons: string[];
    weeklyRideCount: number;
    scoreBreakdown: ScoreBreakdown;
}

export interface UnavailabilityBlock {
    userId: string;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    isAllDay: boolean;
    isRecurring: boolean;
    recurringDayOfWeek: string | null;
}
