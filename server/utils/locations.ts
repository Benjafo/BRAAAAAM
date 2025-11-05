import { and, eq, isNull } from "drizzle-orm";
import { locations } from "../drizzle/org/schema.js";

export type Address = {
    addressLine1?: string;
    addressLine2?: string | null;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
};

/**
 * Find or create a location record in the database.
 * Looks for an existing location with the same full address.
 * If found, returns the existing location ID.
 * If not found, creates a new location and returns its ID.
 *
 * @param db - Drizzle database instance
 * @param address - Address object with optional fields
 * @returns Location ID (UUID string) or null if no address provided
 */
// export async function getOrCreateLocation(
//     db: NodePgDatabase<any>,
//     address: Address | null | undefined
// ): Promise<string | null> {
//     // Create or reuse a location record if provided
//     let addressId: string | null = null;
//     if (address) {
//         // Normalize fields to avoid case-sensitive mismatches
//         const addr1 = address.addressLine1?.trim() ?? "";
//         const addr2 = address.addressLine2?.trim() ?? null;
//         const city = address.city?.trim() ?? "";
//         const state = address.state?.trim() ?? "";
//         const zip = address.zip?.trim() ?? "";
//         const country = address.country?.trim() ?? "";

//         // Look for existing location with same full address
//         const [existingLocation] = await db
//             .select({ id: locations.id })
//             .from(locations)
//             .where(
//                 and(
//                     eq(locations.addressLine1, addr1),
//                     eq(locations.addressLine2, addr2),
//                     eq(locations.city, city),
//                     eq(locations.state, state),
//                     eq(locations.zip, zip),
//                     eq(locations.country, country)
//                 )
//             );

//         if (existingLocation) {
//             addressId = existingLocation.id;
//         } else {
//             // No existing match, make new location
//             const [newLocation] = await db
//                 .insert(locations)
//                 .values({
//                     addressLine1: addr1,
//                     addressLine2: addr2,
//                     city,
//                     state,
//                     zip,
//                     country,
//                 })
//                 .returning({ id: locations.id });

//             addressId = newLocation.id;
//         }
//     }

//     return addressId;
// }
// Find or create a location
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const findOrCreateLocation = async (db: any, address: Address): Promise<string> => {
    const addr1 = address.addressLine1?.trim() ?? "";
    const addr2 = address.addressLine2?.trim() || null;
    const city = address.city?.trim() ?? "";
    const state = address.state?.trim() ?? "";
    const zip = address.zip?.trim() ?? "";
    const country = address.country?.trim() ?? "";

    // Look for existing location with same full address
    // Note: SQL NULL comparisons require IS NULL, not = NULL
    const [existingLocation] = await db
        .select({ id: locations.id })
        .from(locations)
        .where(
            and(
                eq(locations.addressLine1, addr1),
                addr2 === null ? isNull(locations.addressLine2) : eq(locations.addressLine2, addr2),
                eq(locations.city, city),
                eq(locations.state, state),
                eq(locations.zip, zip),
                eq(locations.country, country)
            )
        );

    if (existingLocation) {
        return existingLocation.id;
    }

    // No existing match, make new location
    const [newLocation] = await db
        .insert(locations)
        .values({
            addressLine1: addr1,
            addressLine2: addr2,
            city,
            state,
            zip,
            country,
        })
        .returning({ id: locations.id });

    return newLocation.id;
};
