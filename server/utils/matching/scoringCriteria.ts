import { ClientDetails, DriverProfile, MatchingContext } from "../../types/matching.types.js";

/**
 * Score vehicle type match
 * Returns 30 points if match, 0 points if no match
 */
export function scoreVehicleMatch(driver: DriverProfile, client: ClientDetails): number {
    const clientVehicleTypes = client.vehicleTypes || [];

    // Client has no preference - give full points
    if (clientVehicleTypes.length === 0) {
        return 30;
    }

    // Check if driver has any vehicle type that matches client preferences
    const driverVehicleTypes = driver.vehicleTypes || [];
    const hasMatch = driverVehicleTypes.some((vehicleType) => clientVehicleTypes.includes(vehicleType));

    // Match found
    if (hasMatch) {
        return 30;
    }

    // No match - no points awarded
    return 0;
}

/**
 * Score driver under max rides per week
 * Returns 0-20 points
 */
export function scoreUnderMaxRidesPerWeek(driver: DriverProfile, context: MatchingContext): number {
    const driverWeekRides = context.weekRidesMap.get(driver.id) || 0;
    const maxRides = driver.maxRidesPerWeek || 0;

    // No max set (unlimited) - give full points
    if (maxRides === 0) {
        return 20;
    }

    // Driver is at or over max - no positive points
    if (driverWeekRides >= maxRides) {
        return 0;
    }

    // Driver is under max - scale from 0 (at max) to 20 (no rides)
    // Linear scale: 20 * (maxRides - currentRides) / maxRides
    const score = 20 * (maxRides - driverWeekRides) / maxRides;

    return Math.round(score);
}

