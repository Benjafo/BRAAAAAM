import { DriverProfile, MatchingContext, ScoreBreakdown } from "../../types/matching.types.js";
import { checkAvailability } from "./availabilityCheck.js";
import { scoreLoadBalancing } from "./loadBalancing.js";
import {
    scoreVehicleMatch,
    scoreUnderMaxRidesPerWeek,
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

    score += scoreLoadBalancing(driver, context); // up to 50pts
    score += scoreVehicleMatch(driver, context.client); // 30pts
    score += scoreUnderMaxRidesPerWeek(driver, context); // up to 20pts

    // APPLY PENALTIES - These are warnings, not disqualifiers

    // 1. Unavailability penalty (-50pts)
    if (!checkAvailability(driver, context)) {
        score -= 50;
    }

    // 2. Concurrent ride penalty (tiered based on overlap percentage)
    const overlapPercentage = context.concurrentRideOverlapMap.get(driver.id) || 0;
    if (overlapPercentage >= 50) {
        score -= 25;
    } else if (overlapPercentage >= 25) {
        score -= 15;
    } else if (overlapPercentage > 0) {
        score -= 10;
    }

    // 3. Over max rides penalty (-5pts per ride over)
    const driverWeekRides = context.weekRidesMap.get(driver.id) || 0;
    const maxRides = driver.maxRidesPerWeek || 0;
    if (maxRides > 0 && driverWeekRides > maxRides) {
        const ridesOver = driverWeekRides - maxRides;
        score -= ridesOver * 5;
    }

    return score;
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

    // Vehicle match
    const driverVehicleTypes = driver.vehicleTypes || [];
    const clientVehicleTypes = context.client.vehicleTypes || [];
    const matchingVehicles = driverVehicleTypes.filter((vt) => clientVehicleTypes.includes(vt));
    if (matchingVehicles.length > 0) {
        reasons.push(`Vehicle type matches preference (${matchingVehicles.join(", ")})`);
    }

    // Max rides status
    const maxRides = driver.maxRidesPerWeek || 0;
    if (maxRides > 0 && weekRides < maxRides) {
        const ridesRemaining = maxRides - weekRides;
        reasons.push(`Under weekly limit (${weekRides}/${maxRides}, ${ridesRemaining} remaining)`);
    }

    // Warning conditions
    if (!checkAvailability(driver, context)) {
        reasons.push("⚠️ Unavailable during appointment time");
    }

    const overlapPercentage = context.concurrentRideOverlapMap.get(driver.id) || 0;
    if (overlapPercentage > 0) {
        reasons.push(`⚠️ Has concurrent ride (${Math.round(overlapPercentage)}% overlap)`);
    }

    if (maxRides > 0 && weekRides > maxRides) {
        const ridesOver = weekRides - maxRides;
        reasons.push(`⚠️ Over weekly limit (${weekRides}/${maxRides}, ${ridesOver} over)`);
    }

    return reasons;
}

/**
 * Determine if a driver is a perfect match
 * Perfect match criteria:
 * - All fail checks pass (already handled by meetsAccessibilityRequirements)
 * - Vehicle types match (30 points)
 * - Driver under max rides per week >= 0 points (at or under max)
 * - No negative points applied
 */
export function isPerfectMatch(
    driver: DriverProfile,
    context: MatchingContext
): boolean {
    const breakdown = calculateScoreBreakdown(driver, context);

    // Vehicle type must match (30 points)
    const hasVehicleMatch = breakdown.baseScore.vehicleMatch === 30;

    // Driver must be at or under max rides (>= 0 points)
    const isUnderMaxRides = breakdown.baseScore.underMaxRidesPerWeek >= 0;

    // No penalties applied
    const hasNoPenalties =
        breakdown.penalties.unavailable === 0 &&
        breakdown.penalties.concurrentRide === 0 &&
        breakdown.penalties.overMaxRides === 0;

    return hasVehicleMatch && isUnderMaxRides && hasNoPenalties;
}

/**
 * Calculate detailed score breakdown for display in modal
 */
export function calculateScoreBreakdown(
    driver: DriverProfile,
    context: MatchingContext
): ScoreBreakdown {
    // Calculate base scores
    const rideBalancingScore = scoreLoadBalancing(driver, context);
    const vehicleMatchScore = scoreVehicleMatch(driver, context.client);
    const underMaxRidesScore = scoreUnderMaxRidesPerWeek(driver, context);

    // Calculate penalties
    const unavailabilityPenalty = !checkAvailability(driver, context) ? -50 : 0;

    // Concurrent ride penalty (tiered)
    const overlapPercentage = context.concurrentRideOverlapMap.get(driver.id) || 0;
    let concurrentRidePenalty = 0;
    if (overlapPercentage >= 50) {
        concurrentRidePenalty = -25;
    } else if (overlapPercentage >= 25) {
        concurrentRidePenalty = -15;
    } else if (overlapPercentage > 0) {
        concurrentRidePenalty = -10;
    }

    // Over max rides penalty (-5 per ride over)
    const driverWeekRides = context.weekRidesMap.get(driver.id) || 0;
    const maxRides = driver.maxRidesPerWeek || 0;
    let overMaxRidesPenalty = 0;
    if (maxRides > 0 && driverWeekRides > maxRides) {
        const ridesOver = driverWeekRides - maxRides;
        overMaxRidesPenalty = -(ridesOver * 5);
    }

    // Calculate total
    const total =
        rideBalancingScore +
        vehicleMatchScore +
        underMaxRidesScore +
        unavailabilityPenalty +
        concurrentRidePenalty +
        overMaxRidesPenalty;

    return {
        total,
        baseScore: {
            rideBalancing: rideBalancingScore,
            vehicleMatch: vehicleMatchScore,
            underMaxRidesPerWeek: underMaxRidesScore,
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
            hasVehicleMismatch: vehicleMatchScore === 0,
        },
    };
}
