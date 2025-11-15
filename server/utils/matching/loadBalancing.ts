import { DriverProfile, MatchingContext } from "../../types/matching.types.js";

/**
 * Score based on load balancing - prefer drivers with fewer rides this week
 * Returns 0-40 points
 */
export function scoreLoadBalancing(driver: DriverProfile, context: MatchingContext): number {
    const driverRides = context.weekRidesMap.get(driver.id) || 0;

    // Find max rides across all drivers
    const maxRides = Math.max(
        ...context.allDriversWeekRides.map((r) => r.rideCount),
        1 // Minimum 1 to avoid division by zero
    );

    // Calculate score: 40 * (1 - (driverRides / maxRides))
    // Driver with 0 rides: 40 points
    // Driver with max rides: 0 points
    const score = 40 * (1 - driverRides / maxRides);

    return Math.round(score);
}
