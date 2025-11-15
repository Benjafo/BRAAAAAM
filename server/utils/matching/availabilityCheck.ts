import { DriverProfile, MatchingContext, UnavailabilityBlock } from "../../types/matching.types.js";

/**
 * Check if driver has unavailability during appointment time
 */
export function checkAvailability(driver: DriverProfile, context: MatchingContext): boolean {
    const driverBlocks = context.unavailabilityMap.get(driver.id) || [];

    for (const block of driverBlocks) {
        if (hasUnavailabilityDuringAppointment(block, context.appointment)) {
            return false; // Driver is unavailable
        }
    }

    return true; // Driver is available
}

/**
 * Check if a specific unavailability block conflicts with appointment
 */
function hasUnavailabilityDuringAppointment(
    block: UnavailabilityBlock,
    appointment: { startDate: string; startTime: string; estimatedDurationMinutes: number | null }
): boolean {
    if (block.isRecurring) {
        // Check recurring blocks
        const appointmentDayOfWeek = new Date(appointment.startDate).toLocaleDateString("en-US", {
            weekday: "long",
        });

        if (block.recurringDayOfWeek === appointmentDayOfWeek) {
            // Check time overlap if not all-day
            if (block.isAllDay) return true;

            if (block.startTime && block.endTime && appointment.startTime) {
                const appointmentEndTime = calculateEndTime(
                    appointment.startTime,
                    appointment.estimatedDurationMinutes || 60
                );
                return timeOverlaps(
                    appointment.startTime,
                    appointmentEndTime,
                    block.startTime,
                    block.endTime
                );
            }
        }
    } else {
        // Check non-recurring blocks
        if (appointment.startDate >= block.startDate && appointment.startDate <= block.endDate) {
            if (block.isAllDay) return true;

            if (block.startTime && block.endTime && appointment.startTime) {
                const appointmentEndTime = calculateEndTime(
                    appointment.startTime,
                    appointment.estimatedDurationMinutes || 60
                );
                return timeOverlaps(
                    appointment.startTime,
                    appointmentEndTime,
                    block.startTime,
                    block.endTime
                );
            }
        }
    }

    return false;
}

/**
 * Calculate end time from start time and duration in minutes
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;

    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;

    return `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
}

/**
 * Check if two time ranges overlap
 */
function timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
}
