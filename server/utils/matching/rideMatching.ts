import { DriverProfile, MatchingContext, ScoreBreakdown } from "../../types/matching.types.js";
import { checkAvailability } from "./availabilityCheck.js";
import { scoreLoadBalancing } from "./loadBalancing.js";
import {
    scoreMobilityEquipment,
    scoreSpecialAccommodations,
    scoreVehicleMatch,
} from "./scoringCriteria.js";

/**
 * Main matching function - calculates score for a driver
 * Returns null if driver fails hard requirements
 */
export function calculateDriverScore(
    driver: DriverProfile,
    context: MatchingContext
): number | null {
    // HARD REQUIREMENTS - Only critical accessibility needs
    if (!meetsAccessibilityRequirements(driver, context)) {
        return null; // Driver cannot accommodate critical client/appointment needs
    }

    // START WITH BASE SCORING - Calculate points
    let score = 0;

    score += scoreLoadBalancing(driver, context); // 40pts
    score += scoreVehicleMatch(driver, context.client); // 25pts (or -15 penalty)
    score += scoreMobilityEquipment(driver, context.client); // 20pts
    score += scoreSpecialAccommodations(driver, context.client); // 15pts

    // APPLY PENALTIES - These are warnings, not disqualifiers

    // 1. Unavailability penalty (-30pts)
    if (!checkAvailability(driver, context)) {
        score -= 30;
    }

    // 2. Concurrent ride penalty (-25pts)
    if (context.concurrentRidesSet.has(driver.id)) {
        score -= 25;
    }

    // 3. Over max rides penalty (-20pts)
    const driverWeekRides = context.weekRidesMap.get(driver.id) || 0;
    const maxRides = driver.maxRidesPerWeek || 0;
    if (maxRides > 0 && driverWeekRides >= maxRides) {
        score -= 20;
    }

    return score; // Can range from -90 to +100
}

/**
 * Check if driver meets all accessibility requirements
 */
function meetsAccessibilityRequirements(driver: DriverProfile, context: MatchingContext): boolean {
    const { client, appointment } = context;

    // Check mobility equipment
    const clientEquipment = client.mobilityEquipment || [];
    const driverEquipment = driver.canAccommodateMobilityEquipment || [];

    const canAccommodateAllEquipment = clientEquipment.every((equipment) =>
        driverEquipment.includes(equipment)
    );

    if (clientEquipment.length > 0 && !canAccommodateAllEquipment) {
        return false;
    }

    // Check oxygen
    if (client.hasOxygen && !driver.canAccommodateOxygen) {
        return false;
    }

    // Check service animal
    if (client.hasServiceAnimal && !driver.canAccommodateServiceAnimal) {
        return false;
    }

    // Check additional rider (appointment-specific requirement)
    if (appointment.hasAdditionalRider && !driver.canAccommodateAdditionalRider) {
        return false;
    }

    // Vehicle type is now handled as a scoring penalty, not a hard requirement

    return true;
}

/**
 * Generate match reasons for display
 */
export function generateMatchReasons(
    driver: DriverProfile,
    score: number,
    context: MatchingContext
): string[] {
    const reasons: string[] = [];

    // Load balancing
    const weekRides = context.weekRidesMap.get(driver.id) || 0;
    if (weekRides === 0) {
        reasons.push("No rides this week");
    } else if (weekRides <= 2) {
        reasons.push(`Low weekly load (${weekRides} rides)`);
    }

    // Accessibility
    if (context.client.hasOxygen && driver.canAccommodateOxygen) {
        reasons.push("Can accommodate oxygen");
    }
    if (context.client.hasServiceAnimal && driver.canAccommodateServiceAnimal) {
        reasons.push("Can accommodate service animal");
    }

    // Vehicle match
    if (context.client.vehicleTypes?.includes(driver.vehicleType || "")) {
        reasons.push(`Vehicle type matches preference (${driver.vehicleType})`);
    }

    // Warning conditions
    if (!checkAvailability(driver, context)) {
        reasons.push("⚠️ Unavailable during appointment time");
    }
    if (context.concurrentRidesSet.has(driver.id)) {
        reasons.push("⚠️ Has concurrent ride scheduled");
    }
    const driverWeekRides = context.weekRidesMap.get(driver.id) || 0;
    const maxRides = driver.maxRidesPerWeek || 0;
    if (maxRides > 0 && driverWeekRides >= maxRides) {
        reasons.push(`⚠️ At weekly ride limit (${driverWeekRides}/${maxRides})`);
    }

    return reasons;
}

/**
 * Calculate detailed score breakdown for display in modal
 */
export function calculateScoreBreakdown(
    driver: DriverProfile,
    context: MatchingContext
): ScoreBreakdown {
    // Calculate base scores
    const loadBalancingScore = scoreLoadBalancing(driver, context);
    const vehicleMatchScore = scoreVehicleMatch(driver, context.client);
    const mobilityEquipmentScore = scoreMobilityEquipment(driver, context.client);
    const specialAccommodationsScore = scoreSpecialAccommodations(driver, context.client);

    // Calculate penalties
    const unavailabilityPenalty = !checkAvailability(driver, context) ? -30 : 0;
    const concurrentRidePenalty = context.concurrentRidesSet.has(driver.id) ? -25 : 0;

    const driverWeekRides = context.weekRidesMap.get(driver.id) || 0;
    const maxRides = driver.maxRidesPerWeek || 0;
    const overMaxRidesPenalty = maxRides > 0 && driverWeekRides >= maxRides ? -20 : 0;

    // Calculate total
    const total =
        loadBalancingScore +
        vehicleMatchScore +
        mobilityEquipmentScore +
        specialAccommodationsScore +
        unavailabilityPenalty +
        concurrentRidePenalty +
        overMaxRidesPenalty;

    return {
        total,
        baseScore: {
            loadBalancing: loadBalancingScore,
            vehicleMatch: vehicleMatchScore,
            mobilityEquipment: mobilityEquipmentScore,
            specialAccommodations: specialAccommodationsScore,
        },
        penalties: {
            unavailable: unavailabilityPenalty,
            concurrentRide: concurrentRidePenalty,
            overMaxRides: overMaxRidesPenalty,
        },
        warnings: {
            hasUnavailability: unavailabilityPenalty < 0,
            hasConcurrentRide: concurrentRidePenalty < 0,
            isOverMaxRides: overMaxRidesPenalty < 0,
            hasVehicleMismatch: vehicleMatchScore < 0,
        },
    };
}
