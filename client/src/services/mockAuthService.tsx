// // api/mockAuth.ts
// import type { User, AuthResponse, SignInRequest } from "../lib/types";
// import { useAuthStore } from "@/components/stores/authStore";

// // Mock user database (keep this as is)
// const MOCK_USERS: Record<string, { user: User; password: string }> = {
//     "admin@gmail.com": {
//         user: {
//             id: 1,
//             email: "admin@gmail.com",
//             firstName: "Admin",
//             lastName: "User",
//             role: "admin",
//             permissions: [],
//         },
//         password: "password123",
//     },
//     "driver@gmail.com": {
//         user: {
//             id: 2,
//             email: "driver@gmail.com",
//             firstName: "Driver",
//             lastName: "User",
//             role: "user",
//             permissions: [],
//         },
//         password: "password1234",
//     },
//     "dispatcher@gmail.com": {
//         user: {
//             id: 3,
//             email: "dispatcher@gmail.com",
//             firstName: "Dispatcher",
//             lastName: "User",
//             role: "user",
//             permissions: [],
//         },
//         password: "password1235",
//     },
// };

// /**
//  * Simulate API delay
//  */
// const delay = (ms: number): Promise<void> => {
//     return new Promise((resolve) => setTimeout(resolve, ms));
// };

// /**
//  * Generate mock JWT token
//  */
// const generateMockToken = (userId: number): string => {
//     const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
//     const payload = btoa(
//         JSON.stringify({
//             userId,
//             exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
//             iat: Math.floor(Date.now() / 1000),
//         })
//     );
//     const signature = btoa(`mock-signature-${userId}-${Date.now()}`);
//     return `${header}.${payload}.${signature}`;
// };

// /**
//  * Mock authentication service that simulates API calls
//  * Now uses Zustand store instead of direct localStorage manipulation
//  */
// export const mockAuthService = {
//     /**
//      * Mock sign in - validates credentials against mock database
//      */
//     async signIn(credentials: SignInRequest): Promise<AuthResponse> {
//         // Simulate network delay
//         await delay(800);

//         const { email, password } = credentials;
//         const mockUser = MOCK_USERS[email.toLowerCase()];

//         // Simulate authentication failure
//         if (!mockUser || mockUser.password !== password) {
//             throw new Error("Invalid email or password");
//         }

//         // Generating mock token
//         const token = generateMockToken(mockUser.user.id);

//         const response: AuthResponse = {
//             user: mockUser.user,
//             token,
//         };

//         // Store in Zustand store
//         useAuthStore.getState().setAuth(mockUser.user, token);

//         return response;
//     },

//     /**
//      * Mock sign out
//      */
//     async signOut(): Promise<void> {
//         // Simulate network delay
//         await delay(300);

//         // Clear auth state (Zustand will handle localStorage cleanup)
//         useAuthStore.getState().clearAuth();
//     },

//     /**
//      * Get current authentication token
//      */
//     getToken(): string | null {
//         return useAuthStore.getState().token;
//     },

//     /**
//      * Get current user data
//      */
//     getUser(): User | null {
//         return useAuthStore.getState().user;
//     },

//     /**
//      * Check if user is authenticated
//      */
//     isAuthenticated(): boolean {
//         return useAuthStore.getState().isAuthenticated;
//     },
// };
