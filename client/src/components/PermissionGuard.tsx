import { useAuthStore } from "@/components/stores/authStore";
import { Navigate } from "@tanstack/react-router";
import { type ReactNode } from "react";

interface PermissionGuardProps {
    children: ReactNode;
    permission: string | string[];
    requireAll?: boolean; // For arrays true = all permissions required, false = any permission
    fallback?: ReactNode; // Render this component if permisson check fails
    redirectTo?: string; // Redirect to this path if permission check fails
}

// Do we need this? Thought it might be useful but then started implementing role/perm without this

export function PermissionGuard({
    children,
    permission,
    requireAll = false,
    fallback = null,
    redirectTo,
}: PermissionGuardProps) {
    const hasPermission = useAuthStore((state) => state.hasPermission);
    const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
    const hasAllPermissions = useAuthStore((state) => state.hasAllPermissions);

    const hasAccess = Array.isArray(permission)
        ? requireAll
            ? hasAllPermissions(permission)
            : hasAnyPermission(permission)
        : hasPermission(permission);

    if (!hasAccess) {
        if (redirectTo) {
            return <Navigate to={redirectTo} />;
        }
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
