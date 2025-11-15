import { DriverProfile, MatchingContext } from "../../types/matching.types.js";

/**
 * Score based on load balancing - prefer drivers with fewer rides this week
 * Returns 0-40 points
 *
 * Uses inverse scoring that adapts to the organization's capacity.
 * The scale is determined by the organization's actual maxRidesPerWeek settings.
 */
export function scoreLoadBalancing(driver: DriverProfile, context: MatchingContext): number {
    const driverRides = context.weekRidesMap.get(driver.id) || 0;

    // Determine the organization's capacity scale from actual driver settings
    // Find the highest maxRidesPerWeek (excluding 0/unlimited)
    const maxRidesSettings = context.allDriversMaxRides
        .map((d) => d.maxRidesPerWeek)
        .filter((max) => max > 0); // Exclude unlimited (0) settings

    let organizationScale: number;

    if (maxRidesSettings.length > 0) {
        // Use the highest maxRidesPerWeek setting as the organization's capacity
        organizationScale = Math.max(...maxRidesSettings);
    } else {
        // All drivers have unlimited - use current activity with buffer
        const currentMaxRides = Math.max(
            ...context.allDriversWeekRides.map((r) => r.rideCount),
            0
        );
        // Use 2x current max with a floor of 5 to allow room for growth
        organizationScale = Math.max(currentMaxRides * 2, 5);
    }

    // Calculate points deducted per ride based on organization scale
    // Automatically adapts: small orgs (max 5) = 8pts/ride, large orgs (max 20) = 2pts/ride
    const pointsPerRide = 40 / organizationScale;

    // Inverse scoring: fewer rides = more points
    // Ensures equal distribution gives equal scores (not 0)
    const score = Math.max(0, 40 - driverRides * pointsPerRide);

    return Math.round(score);
}
