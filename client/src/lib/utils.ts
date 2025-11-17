import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Parses a date string (YYYY-MM-DD) as a local date, not UTC.
 * This prevents timezone-related off-by-one errors.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object at midnight in local timezone, or undefined if invalid
 */
export function parseLocalDate(dateString: string | null | undefined): Date | undefined {
    if (!dateString) return undefined;

    // Split the date string and create date in local timezone
    const [year, month, day] = dateString.split("-").map(Number);
    if (!year || !month || !day) return undefined;

    // Month is 0-indexed in JavaScript Date
    return new Date(year, month - 1, day);
}

/**
 * Formats a Date to YYYY-MM-DD in local timezone, not UTC.
 * This prevents timezone-related off-by-one errors.
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format in local timezone, or null if invalid
 */
export function formatLocalDate(date: Date | null | undefined): string | null {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}
