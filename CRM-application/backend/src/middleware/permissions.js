
import { ApiError } from "../utils/apiError.js";

/**
 * Permission definitions for Client Admin operations.
 *
 * These are logical permission names used to guard sensitive
 * routes. They are checked against the crmUser role in the
 * database; Client Admins (ORGANIZATION_ADMIN) hold all
 * permissions by default.
 *
 * Add finer-grained MANAGER / SALES entries here if needed.
 */
const ROLE_PERMISSIONS = {
    ORGANIZATION_ADMIN: new Set([
        // User management
        "users:read",
        "users:create",
        "users:update",
        "users:delete",
        "users:status",

        // Teams
        "teams:read",
        "teams:create",
        "teams:update",
        "teams:delete",

        // Leads
        "leads:read",
        "leads:create",
        "leads:update",
        "leads:delete",

        // Deals
        "deals:read",
        "deals:create",
        "deals:update",
        "deals:delete",

        // Tasks
        "tasks:read",
        "tasks:create",
        "tasks:update",
        "tasks:delete",

        // Employees
        "employees:read",
        "employees:create",
        "employees:update",
        "employees:delete",

        // Settings
        "settings:read",
        "settings:update",

        // Profile
        "profile:update",
        "password:update",

        // Products
        "products:read",
        "products:create",
        "products:update",
        "products:delete",

        // Dashboard
        "dashboard:read",
    ]),
    MANAGER: new Set([
        "leads:read",
        "leads:create",
        "leads:update",
        "deals:read",
        "deals:create",
        "deals:update",
        "tasks:read",
        "tasks:create",
        "tasks:update",
        "tasks:delete",
        "employees:read",
        "users:read",
        "teams:read",
        "dashboard:read",
        "profile:update",
        "password:update",
        "products:read",
    ]),
    SALES: new Set([
        "leads:read",
        "leads:create",
        "deals:read",
        "tasks:read",
        "tasks:create",
        "tasks:update",
        "profile:update",
        "password:update",
        "dashboard:read",
        "products:read",
    ]),
};

/**
 * requirePermission(permission)
 *
 * Returns middleware that checks whether the authenticated
 * crmUser holds the specified permission for their role.
 *
 * MUST be used after requireClientAdmin (or requireUser) so
 * that req.crmUser is already populated.
 *
 * Example:
 *   router.delete(
 *     "/users/:id",
 *     requirePermission("users:delete"),
 *     deleteUser
 *   );
 */
export const requirePermission = (permission) => {
    if (typeof permission !== "string" || !permission) {
        throw new Error(
            `requirePermission: 'permission' must be a non-empty string, got ${JSON.stringify(permission)}`
        );
    }

    return (req, res, next) => {
        const role = req.crmUser?.role ?? req.user?.role;

        if (!role) {
            return next(
                new ApiError(403, "Access denied: no role assigned")
            );
        }

        const permissions = ROLE_PERMISSIONS[role];

        if (!permissions || !permissions.has(permission)) {
            return next(
                new ApiError(
                    403,
                    `Access denied: '${permission}' permission required`
                )
            );
        }

        return next();
    };
};

/**
 * hasPermission(role, permission)
 *
 * Pure helper – check without throwing.
 */
export const hasPermission = (role, permission) =>
    Boolean(ROLE_PERMISSIONS[role]?.has(permission));
