import { api } from "@/http/api";
import { makeUserService } from "@/services/org/users.service";
import { useQuery } from "@tanstack/react-query";

const users = makeUserService(api);

export function useUserById() {

    return (id: string) => useQuery({
        queryKey: ['user', id],
        queryFn: () => users.get(id)
    })
}

export function useCreateUser() {

    /** @TODO */
    // return useMutation({
    //     mutationFn: () => {},
    //     onSuccess: () => {},
    //     onError: (error) => {
    //         if(import.meta.env.DEV) {
    //             console.error("useUpdateUserById error", error)
    //         }
    //     }
    // })
}

export function useUpdateUserById() {

    /** @TODO */
    // return useMutation({
    //     mutationFn: () => {},
    //     onSuccess: () => {},
    //     onError: (error) => {
    //         if(import.meta.env.DEV) {
    //             console.error("useUpdateUserById error", error)
    //         }
    //     }
    // })
}

export function useDeleteUserById() {

    /** @TODO */
    // return useMutation({
    //     mutationFn: () => {},
    //     onSuccess: () => {},
    //     onError: (error) => {
    //         if(import.meta.env.DEV) {
    //             console.error("useUpdateUserById error", error)
    //         }
    //     }
    // })
}

export function useUsers() {

    //defaults to no filters
    return (filters: any = {}) => useQuery({
        queryKey: ['users', filters],
        queryFn: () => users.getAll(filters)
    })
}