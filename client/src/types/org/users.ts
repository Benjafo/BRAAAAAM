import type { Role } from "./roles";

export interface UserService {
    get(id: string): Promise<User>,
    // create(user: User),
    // update(user: User),
    // delete(id: string),
    getAll(filters: Partial<Omit<User, 'role'>> & {role: string}): Promise<User[]>,
}

export type User = {
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    contactPreference: string,
    role: Role,
    isDriver: boolean,
    isActive?: boolean,
    createdAt?: string,
    updatedAt?: string,
}