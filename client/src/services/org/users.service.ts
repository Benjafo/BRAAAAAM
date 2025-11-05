import type { TableUser, User, UserService } from "@/types/org/users"
import type { KyInstance, SearchParamsOption } from "ky"

export const makeUserService = (http: KyInstance): UserService => ({
    async get(id: string): Promise<User> {
        return http.get(`o/users${id}`).json<User>()
    },
    // async create() {},
    // async update() {},
    // async delete(id: string): Promise<void> {},
    async getAll(filters: SearchParamsOption): Promise<TableUser[]> {
        return http.get('o/users', {
            searchParams: filters
        }).json<TableUser[]>()
    },
})