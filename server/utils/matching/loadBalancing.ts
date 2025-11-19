import { DriverProfile, MatchingContext } from "../../types/matching.types.js";

/**
 * Score based on load balancing - prefer drivers with fewer rides this week
 * Returns 0-50 points
 *
 * Uses standard deviation to distribute rides evenly across drivers.
 * Drivers below the mean get more points, drivers above the mean get fewer points.
 */
export function scoreLoadBalancing(driver: DriverProfile, context: MatchingContext): number {
    const driverRides = context.weekRidesMap.get(driver.id) || 0;

    // Calculate mean ride count
    const allRideCounts = context.allDriversWeekRides.map((d) => d.rideCount);

    // If no ride data exists (all drivers have 0 rides), give everyone equal points
    if (allRideCounts.length === 0 || allRideCounts.every(count => count === 0)) {
        return 25;
    }

    const mean = allRideCounts.reduce((sum, count) => sum + count, 0) / allRideCounts.length;

    // Calculate standard deviation
    const squaredDiffs = allRideCounts.map((count) => Math.pow(count - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / allRideCounts.length;
    const stdDev = Math.sqrt(variance);

    // If everyone has the same rides (stdDev = 0), give everyone equal points
    if (stdDev === 0 || isNaN(stdDev)) {
        return 25;
    }

    // Calculate how many standard deviations below mean this driver is
    // Positive value = below mean (fewer rides) = good
    // Negative value = above mean (more rides) = bad
    const deviation = (mean - driverRides) / stdDev;

    // Convert to score (0-50)
    // +2 std devs below mean (much fewer rides) = 50 points
    // 0 (at mean) = 25 points
    // -2 std devs above mean (much more rides) = 0 points
    const score = 25 + (deviation / 2) * 25;

    return Math.max(0, Math.min(50, Math.round(score)));
}
