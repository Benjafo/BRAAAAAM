// Option 2: Update your ProtectedRoute to force re-render on auth changes
import { useAuth } from "../hooks/useAuth";
import { Navigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, user, isLoading, initialize } = useAuth();
    const location = useLocation();
    const [hasInitialized, setHasInitialized] = useState(false);

    // Force initialization on mount to ensure fresh auth state
    useEffect(() => {
        initialize();
        setHasInitialized(true);
    }, [initialize]);

    // Show loading until we've initialized
    if (isLoading || !hasInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // This should now properly redirect after logout
    if (!isAuthenticated) {
        return <Navigate to="/sign-in" search={{ redirect: location.pathname }} replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
