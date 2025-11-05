import { api } from "@/http/api";
import { makeUserService } from "@/services/org/users.service";
import { useQuery } from "@tanstack/react-query";
import type { SearchParamsOption } from "ky";

const users = makeUserService(api);

export const useUserById = (id: string) => useQuery({
    queryKey: ['user', id],
    queryFn: () => users.get(id)
})

/** @TODO */
// export const useCreateUser = () => useMutation({
//         mutationFn: () => {},
//         onSuccess: () => {},
//         onError: (error) => {
//             if(import.meta.env.DEV) {
//                 console.error("useCreateUser error", error)
//             }
//         }
// })

/** @TODO */
// export const useUpdateUserById = () => useMutation({
//         mutationFn: () => {},
//         onSuccess: () => {},
//         onError: (error) => {
//             if(import.meta.env.DEV) {
//                 console.error("useUpdateUserById error", error)
//             }
//         }
// })

/** @TODO */
// export const useDeleteUserById = () => useMutation({
//         mutationFn: () => {},
//         onSuccess: () => {},
//         onError: (error) => {
//             if(import.meta.env.DEV) {
//                 console.error("useDeleteUserById error", error)
//             }
//         }
// })

export const useUsers = (filters: SearchParamsOption) => useQuery({
    queryKey: ['users'],
    queryFn: () => users.getAll(filters)
})