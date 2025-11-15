import { ClientDetails, DriverProfile } from "../../types/matching.types.js";

/**
 * Score vehicle type match
 * Returns -15 to 25 points
 */
export function scoreVehicleMatch(driver: DriverProfile, client: ClientDetails): number {
    const clientVehicleTypes = client.vehicleTypes || [];

    // Client has no preference
    if (clientVehicleTypes.length === 0) {
        return 20;
    }

    // Perfect match
    if (driver.vehicleType && clientVehicleTypes.includes(driver.vehicleType)) {
        return 25;
    }

    // No match - apply penalty (warning condition)
    return -15;
}

/**
 * Score mobility equipment match
 * Returns 20 points (all qualifying drivers receive full points)
 */
export function scoreMobilityEquipment(driver: DriverProfile, client: ClientDetails): number {
    const clientEquipment = client.mobilityEquipment || [];

    // Client has no equipment OR driver can accommodate all (hard requirement ensures 100% match)
    // All qualifying drivers receive full points
    return 20;
}

/**
 * Score special accommodations (oxygen, service animal)
 * Returns 0-15 points
 */
export function scoreSpecialAccommodations(driver: DriverProfile, client: ClientDetails): number {
    let score = 0;

    // Oxygen accommodation (hard requirement ensures match if needed)
    if (client.hasOxygen && driver.canAccommodateOxygen) {
        score += 7.5;
    }

    // Service animal accommodation (hard requirement ensures match if needed)
    if (client.hasServiceAnimal && driver.canAccommodateServiceAnimal) {
        score += 7.5;
    }

    return score;
}
