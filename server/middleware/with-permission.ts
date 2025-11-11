import { NextFunction, Request, Response } from "express";
import { hasAllPermissions, hasAnyPermission, hasPermission } from "../utils/permissions.js";

interface PermissionOptions {
    permissions?: string | string[];
    requireAll?: boolean; // If true, requires ALL permissions; if false, requires ANY (default: false)
    customError?: string; // Custom error message
    scoped?: {
        resource: string; // e.g., 'unavailability'
        action: string; // e.g., 'read', 'create', 'update', 'delete'
        getTargetUserId: (req: Request) => string; // Function to extract target user ID from request
    };
}

/**
 * Middleware to check if user has required permissions
 *
 * Usage:
 * // Single permission
 * router.get('/users', withAuth, withOrg, withPermission({ permissions: 'users.read' }), handler);
 *
 * // Multiple permissions (ANY)
 * router.post('/users', withAuth, withOrg, withPermission({
 *   permissions: ['users.create', 'users.admin']
 * }), handler);
 *
 * // Multiple permissions (ALL)
 * router.put('/users/:id/role', withAuth, withOrg, withPermission({
 *   permissions: ['users.update', 'roles.read'],
 *   requireAll: true
 * }), handler);
 */

export function withPermission(options: PermissionOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const userId = req.user?.id;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const orgDb = req.org?.db;

            if (!userId || !orgDb) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "Authentication required",
                });
            }

            let hasAccess = false;

            // Handle scoped permissions (e.g., "own" vs "all" resources)
            if (options.scoped) {
                const { resource, action, getTargetUserId } = options.scoped;
                const targetUserId = getTargetUserId(req);
                const isOwn = targetUserId === userId;

                const allPermission = `all${resource}.${action}`;
                const ownPermission = `own${resource}.${action}`;

                const canAccessAll = await hasPermission(userId, allPermission, orgDb);
                const canAccessOwn = await hasPermission(userId, ownPermission, orgDb);

                hasAccess = canAccessAll || (canAccessOwn && isOwn);

                if (!hasAccess) {
                    return res.status(403).json({
                        error: options.customError || "Insufficient permissions",
                        message: isOwn
                            ? `Permission required: ${ownPermission} or ${allPermission}`
                            : `Permission required: ${allPermission}`,
                        required: isOwn ? [ownPermission, allPermission] : [allPermission],
                    });
                }
            } else if (options.permissions) {
                // Handle standard permission checks
                const permissions = Array.isArray(options.permissions)
                    ? options.permissions
                    : [options.permissions];

                // Check permissions based on requirements
                if (permissions.length === 1) {
                    // Single permission check
                    hasAccess = await hasPermission(userId, permissions[0], orgDb);
                } else if (options.requireAll) {
                    // Require ALL permissions
                    hasAccess = await hasAllPermissions(userId, permissions, orgDb);
                } else {
                    // Require ANY permission (default)
                    hasAccess = await hasAnyPermission(userId, permissions, orgDb);
                }

                if (!hasAccess) {
                    return res.status(403).json({
                        error: options.customError || "Insufficient permissions",
                        message: options.requireAll
                            ? `All of these permissions are required: ${permissions.join(", ")}`
                            : `At least one of these permissions is required: ${permissions.join(", ")}`,
                        required: permissions,
                        requireAll: options.requireAll || false,
                    });
                }
            } else {
                // Neither scoped nor permissions provided
                return res.status(500).json({
                    error: "Configuration error",
                    message: "Either 'permissions' or 'scoped' must be provided to withPermission",
                });
            }

            return next();
        } catch (error) {
            console.error("[withPermission] Error checking permissions:", error);
            res.status(500).json({
                error: "Internal server error",
                message: "Failed to verify permissions",
            });
        }
    };
}

/**
 * Helper middleware for routes that require system admin access
 */
export function requireSystemAdmin() {
    return withPermission({
        permissions: "system.admin",
        customError: "System administrator access required",
    });
}

/**
 * Helper middleware for read-only access to a resource
 */
export function requireReadAccess(resource: string) {
    return withPermission({
        permissions: `${resource}.read`,
        customError: `Read access to ${resource} required`,
    });
}

/**
 * Helper middleware for write access to a resource
 */
export function requireWriteAccess(resource: string) {
    return withPermission({
        permissions: [`${resource}.create`, `${resource}.update`],
        customError: `Write access to ${resource} required`,
    });
}

/**
 * Helper middleware for full access to a resource
 */
export function requireFullAccess(resource: string) {
    return withPermission({
        permissions: [
            `${resource}.read`,
            `${resource}.create`,
            `${resource}.update`,
            `${resource}.delete`,
        ],
        requireAll: true,
        customError: `Full access to ${resource} required`,
    });
}
