import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/components/stores/authStore";
import { mockAuthService } from "@/services/mockAuthService";
import { useRouter } from "@tanstack/react-router";

export function useAuth() {
    const { user, token, isAuthenticated, clearAuth } = useAuthStore();
    const queryClient = useQueryClient();
    const router = useRouter();

    // React Query for getting current user (using Zustand state)
    const {
        data: authData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["currentUser"],
        queryFn: async () => {
            // Return current auth state from Zustand
            const currentUser = mockAuthService.getUser();
            const currentToken = mockAuthService.getToken();
            const isAuth = mockAuthService.isAuthenticated();

            return {
                user: currentUser,
                token: currentToken,
                isAuthenticated: isAuth,
            };
        },
        staleTime: 5 * 60 * 1000,
        initialData: { user, token, isAuthenticated }, // Use Zustand state as initial data
    });

    const signOut = async () => {
        try {
            await mockAuthService.signOut();
            // Clear React Query cache
            queryClient.removeQueries({ queryKey: ["currentUser"] });
            // Navigate to sign-in
            router.navigate({ to: "/sign-in", replace: true });
        } catch (error) {
            console.error("Sign out error:", error);
            // Force clear even if API fails
            clearAuth();
            queryClient.removeQueries({ queryKey: ["currentUser"] });
            router.navigate({ to: "/sign-in", replace: true });
        }
    };

    return {
        user: authData?.user || user,
        isAuthenticated: authData?.isAuthenticated || isAuthenticated,
        token: authData?.token || token,
        isLoading,
        error,
        signOut,
    };
}
