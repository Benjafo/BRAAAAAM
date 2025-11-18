import type { SearchParamsOption } from "ky";
import type { Location } from "./locations";
import type { Role } from "./roles";

export interface UserService {
    get(id: string): Promise<User>,
    // create(user: User),
    // update(user: User),
    // delete(id: string),
    getAll(filters: SearchParamsOption): Promise<TableUser[]>,
}

export type User = {
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string | null,
    contactPreference: string,
    birthYear: number | null,
    birthMonth: number | null,
    emergencyContactName: string | null,
    emergencyContactPhone: string | null,
    emergencyContactRelationship: string | null,
    role?: Role,
    address?: Location,
    isDriver: boolean,
    isActive?: boolean,
    createdAt?: string,
    updatedAt?: string,
}

export type TableUser = Omit<User, 'role'> & {
    roleId: string | null,
    roleName: string | null,
    phoneIsCell?: boolean,
    okToTextPrimary?: boolean,
    secondaryPhone?: string | null,
    secondaryPhoneIsCell?: boolean,
    okToTextSecondary?: boolean,
    temporaryInactiveUntil?: string | null,
    inactiveSince?: string | null,
    awayFrom?: string | null,
    awayTo?: string | null,
    canAccommodateMobilityEquipment?: string[] | null,
    vehicleType?: string | null,
    vehicleColor?: string | null,
    townPreferences?: string | null,
    destinationLimitations?: string | null,
    canAccommodateOxygen?: boolean | null,
    canAccommodateServiceAnimal?: boolean | null,
    canAccommodateAdditionalRider?: boolean | null,
    maxRidesPerWeek?: number | null,
    lifespanReimbursement?: boolean | null,
    customFields?: Record<string, any>
}