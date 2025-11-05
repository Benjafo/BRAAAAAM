import type { User, UserService } from "@/types/org/users"
import type { KyInstance } from "ky"

export const makeUserService = (http: KyInstance): UserService => ({
    async get(id: string): Promise<User> {
        return http.get(`o/users${id}`).json<User>()
    },
    // async create() {},
    // async update() {},
    // async delete(id: string): Promise<void> {},
    async getAll(filters: Partial<Omit<User, 'role'>> & {role: string}): Promise<User[]> {
        return http.get('o/users', {
            searchParams: filters
        }).json<User[]>()
    },
})