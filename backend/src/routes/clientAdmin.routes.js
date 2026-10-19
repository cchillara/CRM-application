
import { Router } from "express";

import {
    validateBody,
    validateParams,
    validatePagination,
    validateSorting,
} from "../middleware/validateRequest.js";
import { requireClientAdmin } from "../middleware/authmiddleware.js";
import { requirePermission } from "../middleware/permissions.js";
import {
    clientAdminLimiter,
    sensitiveWriteLimiter,
    passwordChangeLimiter,
} from "../middleware/rateLimiter.js";

import {
    getDashboard,

    // Leads
    listLeads,
    createLead,
    updateLead,
    deleteLead,

    // Deals
    listDeals,
    createDeal,
    updateDeal,
    deleteDeal,

    // Tasks
    getTasks,
    createTask,
    updateTask,
    deleteTask,

    // Teams
    getTeams,
    createTeam,
    updateTeam,
    deleteTeam,

    // Products
    listProducts,
    createProduct,
    updateProduct,
    deleteProduct,

    // Employees
    listEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,

    // User management
    listUsers,
    getUser,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,

    // Profile and settings
    updateProfile,
    updatePassword,
    getSettings,
    updateSettings,
} from "../controllers/clientAdmin.controller.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Middleware execution order (applied to every route below)
|--------------------------------------------------------------------------
|
|  1. clientAdminLimiter   – IP-based rate limit (200 req / 15 min)
|  2. requireClientAdmin   – Firebase token → CRM user → org → role
|       internally runs:
|         a. verifyFirebaseIdToken  (token extraction + Firebase verify)
|         b. loadCrmUser            (DB lookup, status, org status)
|         c. role === ORGANIZATION_ADMIN check
|       sets: req.firebaseUser, req.crmUser, req.user, req.organizationId
|  3. Per-route middleware  – validateBody / validateParams /
|                             requirePermission / sensitiveWriteLimiter
|  4. Controller
|
| req.organizationId is ALWAYS sourced from the authenticated DB record.
| Organization IDs supplied in the request body are NEVER trusted.
|
*/

// Global rate limit + authentication for the entire router.
router.use(clientAdminLimiter);
router.use(requireClientAdmin);

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get(
    ["/", "/dashboard", "/client-admin"],
    requirePermission("dashboard:read"),
    getDashboard
);

/*
|--------------------------------------------------------------------------
| Leads
|--------------------------------------------------------------------------
*/

router.get(
    ["/leads", "/client-admin/leads"],
    requirePermission("leads:read"),
    validatePagination(),
    validateSorting({ allowedFields: ["createdAt", "updatedAt", "title", "status"] }),
    listLeads
);

router.post(
    ["/leads", "/client-admin/leads"],
    requirePermission("leads:create"),
    validateBody({
        requiredAnyOf: ["title", "name"],
    }),
    createLead
);

router.patch(
    ["/leads/:id", "/client-admin/leads/:id"],
    requirePermission("leads:update"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    updateLead
);

router.delete(
    ["/leads/:id", "/client-admin/leads/:id"],
    requirePermission("leads:delete"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    sensitiveWriteLimiter,
    deleteLead
);

/*
|--------------------------------------------------------------------------
| Deals
|--------------------------------------------------------------------------
*/

router.get(
    ["/deals", "/client-admin/deals"],
    requirePermission("deals:read"),
    validatePagination(),
    validateSorting({ allowedFields: ["createdAt", "updatedAt", "title", "stage", "value"] }),
    listDeals
);

router.post(
    ["/deals", "/client-admin/deals"],
    requirePermission("deals:create"),
    validateBody({
        required: ["title"],
    }),
    createDeal
);

router.patch(
    ["/deals/:id", "/client-admin/deals/:id"],
    requirePermission("deals:update"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    updateDeal
);

router.delete(
    ["/deals/:id", "/client-admin/deals/:id"],
    requirePermission("deals:delete"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    sensitiveWriteLimiter,
    deleteDeal
);

/*
|--------------------------------------------------------------------------
| Tasks
|--------------------------------------------------------------------------
*/

router.get(
    ["/tasks", "/client-admin/tasks"],
    requirePermission("tasks:read"),
    validatePagination(),
    validateSorting({ allowedFields: ["createdAt", "updatedAt", "title", "status", "dueDate"] }),
    getTasks
);

router.post(
    ["/tasks", "/client-admin/tasks"],
    requirePermission("tasks:create"),
    validateBody({
        required: ["title"],
    }),
    createTask
);

router.patch(
    ["/tasks/:id", "/client-admin/tasks/:id"],
    requirePermission("tasks:update"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    updateTask
);

router.delete(
    ["/tasks/:id", "/client-admin/tasks/:id"],
    requirePermission("tasks:delete"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    sensitiveWriteLimiter,
    deleteTask
);

/*
|--------------------------------------------------------------------------
| Teams
|--------------------------------------------------------------------------
*/

router.get(
    ["/team", "/client-admin/team"],
    requirePermission("teams:read"),
    validatePagination(),
    getTeams
);

router.post(
    ["/team", "/client-admin/team"],
    requirePermission("teams:create"),
    validateBody({
        requiredAnyOf: [
            "name",
            "email",
            "firstName",
            "lastName",
        ],
    }),
    createTeam
);

router.patch(
    ["/team/:id", "/client-admin/team/:id"],
    requirePermission("teams:update"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    updateTeam
);

router.delete(
    ["/team/:id", "/client-admin/team/:id"],
    requirePermission("teams:delete"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    sensitiveWriteLimiter,
    deleteTeam
);

/*
|--------------------------------------------------------------------------
| Products
|--------------------------------------------------------------------------
*/

router.get(
    ["/products", "/client-admin/products"],
    requirePermission("products:read"),
    validatePagination(),
    listProducts
);

router.post(
    ["/products", "/client-admin/products"],
    requirePermission("products:create"),
    validateBody({
        required: ["name"],
        allowedFields: ["name", "category", "price", "billing", "inventory", "status"],
    }),
    createProduct
);

router.patch(
    ["/products/:id", "/client-admin/products/:id"],
    requirePermission("products:update"),
    // Product IDs are "PRD-NNN" strings, not UUIDs — only require presence.
    validateParams({ required: ["id"] }),
    validateBody({
        allowedFields: ["name", "category", "price", "billing", "inventory", "status"],
    }),
    updateProduct
);

router.delete(
    ["/products/:id", "/client-admin/products/:id"],
    requirePermission("products:delete"),
    validateParams({ required: ["id"] }),
    sensitiveWriteLimiter,
    deleteProduct
);

/*
|--------------------------------------------------------------------------
| Employees
|--------------------------------------------------------------------------
*/

router.get(
    ["/employee", "/client-admin/employee"],
    requirePermission("employees:read"),
    validatePagination(),
    listEmployee
);

router.post(
    ["/employee", "/client-admin/employee"],
    requirePermission("employees:create"),
    validateBody({
        required: ["email"],
    }),
    createEmployee
);

router.patch(
    ["/employee/:id", "/client-admin/employee/:id"],
    requirePermission("employees:update"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    updateEmployee
);

router.delete(
    ["/employee/:id", "/client-admin/employee/:id"],
    requirePermission("employees:delete"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    sensitiveWriteLimiter,
    deleteEmployee
);

/*
|--------------------------------------------------------------------------
| User Management
|--------------------------------------------------------------------------
|
| User-management endpoints carry extra limiters and permission
| checks. Controllers must additionally prevent privilege
| escalation, cross-organization access, and unauthorized
| role/status changes.
|
*/

// GET /users
router.get(
    "/users",
    requirePermission("users:read"),
    validatePagination(),
    validateSorting({ allowedFields: ["createdAt", "updatedAt", "email", "firstName", "lastName", "role", "status"] }),
    listUsers
);

// GET /users/:id
router.get(
    "/users/:id",
    requirePermission("users:read"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    getUser
);

// POST /users
router.post(
    "/users",
    requirePermission("users:create"),
    sensitiveWriteLimiter,
    validateBody({
        required: ["email"],
    }),
    createUser
);

// PATCH /users/:id
router.patch(
    "/users/:id",
    requirePermission("users:update"),
    validateParams({ required: ["id"], uuid: ["id"] }),
    updateUser
);

// PATCH /users/:id/status
router.patch(
    "/users/:id/status",
    requirePermission("users:status"),
    sensitiveWriteLimiter,
    validateParams({ required: ["id"], uuid: ["id"] }),
    validateBody({ required: ["status"] }),
    updateUserStatus
);

// DELETE /users/:id
router.delete(
    "/users/:id",
    requirePermission("users:delete"),
    sensitiveWriteLimiter,
    validateParams({ required: ["id"], uuid: ["id"] }),
    deleteUser
);

/*
|--------------------------------------------------------------------------
| Settings
|--------------------------------------------------------------------------
*/

router.get(
    ["/settings", "/client-admin/settings"],
    requirePermission("settings:read"),
    getSettings
);

router.patch(
    ["/settings", "/client-admin/settings"],
    requirePermission("settings:update"),
    updateSettings
);

/*
|--------------------------------------------------------------------------
| Profile
|--------------------------------------------------------------------------
*/

router.patch(
    ["/profile", "/client-admin/profile"],
    requirePermission("profile:update"),
    updateProfile
);

/*
|--------------------------------------------------------------------------
| Password
|--------------------------------------------------------------------------
*/

router.patch(
    ["/password", "/client-admin/password"],
    requirePermission("password:update"),
    passwordChangeLimiter,
    updatePassword
);

export default router;
