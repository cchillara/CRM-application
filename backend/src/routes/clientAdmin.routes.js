
import { Router } from "express";

import { validateBody } from "../middleware/validateRequest.js";
import { requireClientAdmin } from "../middleware/authmiddleware.js";

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
| Shared middleware
|--------------------------------------------------------------------------
|
| Every route in this router is intended for Client Admin access.
| Authentication and authorization are handled by requireClientAdmin.
|
| The middleware validates:
| - Firebase ID token
| - Registered CRM user
| - Active user account
| - ORGANIZATION_ADMIN role
| - Active organization membership
|
| Keep this router mounted only at the intended Client Admin API prefix.
|
*/

// Apply authentication and authorization to every route registered below.
router.use(requireClientAdmin);

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get(
    ["/", "/dashboard", "/client-admin"],
    getDashboard
);

/*
|--------------------------------------------------------------------------
| Leads
|--------------------------------------------------------------------------
*/

// GET /leads
// GET /client-admin/leads
router.get(
    ["/leads", "/client-admin/leads"],
    listLeads
);

// POST /leads
// POST /client-admin/leads
router.post(
    ["/leads", "/client-admin/leads"],
    validateBody({
        requiredAnyOf: ["title", "name"],
    }),
    createLead
);

// PATCH /leads/:id
// PATCH /client-admin/leads/:id
router.patch(
    ["/leads/:id", "/client-admin/leads/:id"],
    updateLead
);

// DELETE /leads/:id
// DELETE /client-admin/leads/:id
router.delete(
    ["/leads/:id", "/client-admin/leads/:id"],
    deleteLead
);

/*
|--------------------------------------------------------------------------
| Deals
|--------------------------------------------------------------------------
*/

// GET /deals
// GET /client-admin/deals
router.get(
    ["/deals", "/client-admin/deals"],
    listDeals
);

// POST /deals
// POST /client-admin/deals
router.post(
    ["/deals", "/client-admin/deals"],
    validateBody({
        required: ["title"],
    }),
    createDeal
);

// PATCH /deals/:id
// PATCH /client-admin/deals/:id
router.patch(
    ["/deals/:id", "/client-admin/deals/:id"],
    updateDeal
);

// DELETE /deals/:id
// DELETE /client-admin/deals/:id
router.delete(
    ["/deals/:id", "/client-admin/deals/:id"],
    deleteDeal
);

/*
|--------------------------------------------------------------------------
| Tasks
|--------------------------------------------------------------------------
*/

// GET /tasks
// GET /client-admin/tasks
router.get(
    ["/tasks", "/client-admin/tasks"],
    getTasks
);

// POST /tasks
// POST /client-admin/tasks
router.post(
    ["/tasks", "/client-admin/tasks"],
    validateBody({
        required: ["title"],
    }),
    createTask
);

// PATCH /tasks/:id
// PATCH /client-admin/tasks/:id
router.patch(
    ["/tasks/:id", "/client-admin/tasks/:id"],
    updateTask
);

// DELETE /tasks/:id
// DELETE /client-admin/tasks/:id
router.delete(
    ["/tasks/:id", "/client-admin/tasks/:id"],
    deleteTask
);

/*
|--------------------------------------------------------------------------
| Teams
|--------------------------------------------------------------------------
*/

// GET /team
// GET /client-admin/team
router.get(
    ["/team", "/client-admin/team"],
    getTeams
);

// POST /team
// POST /client-admin/team
router.post(
    ["/team", "/client-admin/team"],
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

// PATCH /team/:id
// PATCH /client-admin/team/:id
router.patch(
    ["/team/:id", "/client-admin/team/:id"],
    updateTeam
);

// DELETE /team/:id
// DELETE /client-admin/team/:id
router.delete(
    ["/team/:id", "/client-admin/team/:id"],
    deleteTeam
);

/*
|--------------------------------------------------------------------------
| Products
|--------------------------------------------------------------------------
*/

// GET /products
// GET /client-admin/products
router.get(
    ["/products", "/client-admin/products"],
    listProducts
);

// POST /products
// POST /client-admin/products
router.post(
    ["/products", "/client-admin/products"],
    createProduct
);

// PATCH /products/:id
// PATCH /client-admin/products/:id
router.patch(
    ["/products/:id", "/client-admin/products/:id"],
    updateProduct
);

// DELETE /products/:id
// DELETE /client-admin/products/:id
router.delete(
    ["/products/:id", "/client-admin/products/:id"],
    deleteProduct
);

/*
|--------------------------------------------------------------------------
| Employees
|--------------------------------------------------------------------------
*/

// GET /employee
// GET /client-admin/employee
router.get(
    ["/employee", "/client-admin/employee"],
    listEmployee
);

// POST /employee
// POST /client-admin/employee
router.post(
    ["/employee", "/client-admin/employee"],
    validateBody({
        required: ["email"],
    }),
    createEmployee
);

// PATCH /employee/:id
// PATCH /client-admin/employee/:id
router.patch(
    ["/employee/:id", "/client-admin/employee/:id"],
    updateEmployee
);

// DELETE /employee/:id
// DELETE /client-admin/employee/:id
router.delete(
    ["/employee/:id", "/client-admin/employee/:id"],
    deleteEmployee
);

/*
|--------------------------------------------------------------------------
| User Management
|--------------------------------------------------------------------------
|
| User-management endpoints require Client Admin authorization too.
| The controllers must additionally prevent privilege escalation,
| cross-organization access, and unauthorized role/status changes.
|
*/

// GET /users
router.get(
    "/users",
    listUsers
);

// GET /users/:id
router.get(
    "/users/:id",
    getUser
);

// POST /users
router.post(
    "/users",
    createUser
);

// PATCH /users/:id
router.patch(
    "/users/:id",
    updateUser
);

// PATCH /users/:id/status
router.patch(
    "/users/:id/status",
    updateUserStatus
);

// DELETE /users/:id
router.delete(
    "/users/:id",
    deleteUser
);

/*
|--------------------------------------------------------------------------
| Settings
|--------------------------------------------------------------------------
*/

// GET /settings
// GET /client-admin/settings
router.get(
    ["/settings", "/client-admin/settings"],
    getSettings
);

// PATCH /settings
// PATCH /client-admin/settings
router.patch(
    ["/settings", "/client-admin/settings"],
    updateSettings
);

/*
|--------------------------------------------------------------------------
| Profile
|--------------------------------------------------------------------------
*/

// PATCH /profile
// PATCH /client-admin/profile
router.patch(
    ["/profile", "/client-admin/profile"],
    updateProfile
);

/*
|--------------------------------------------------------------------------
| Password
|--------------------------------------------------------------------------
*/

// PATCH /password
// PATCH /client-admin/password
router.patch(
    ["/password", "/client-admin/password"],
    updatePassword
);

export default router;
