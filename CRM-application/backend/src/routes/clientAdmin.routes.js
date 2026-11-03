import { Router } from "express";

import {
    listUsers,
    getUser,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
    listRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    listLeads,
    createLead,
    updateLead,
    deleteLead,
    listCustomers,
    updateCustomer,
    deleteCustomer,
    listCompanies,
    listDeals,
    listTasks,
    createTask,
    updateTask,
    deleteTask,
    getReports,
} from "../controllers/clientAdmin.controller.js";

import { requireClientAdmin, requireRoles } from "../middleware/authmiddleware.js";

const router = Router();

// All client-admin routes require authentication + org resolution
router.use(requireClientAdmin);

// Users
router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

// Roles
router.get("/roles", listRoles);
router.get("/roles/:id", getRole);
router.post("/roles", createRole);
router.patch("/roles/:id", updateRole);
router.delete("/roles/:id", deleteRole);

// Leads (org-filtered, includes legacy PENDING rows)
router.get("/leads", listLeads);

// Customers, Companies, Deals (org-filtered)
router.get("/customers", listCustomers);
router.get("/companies", listCompanies);
router.get("/deals", listDeals);

// Tasks (same table as Sales — filtered by org)
router.get("/tasks", listTasks);
router.post("/tasks", createTask);
router.patch("/tasks/:taskId", updateTask);
router.delete("/tasks/:taskId", deleteTask);

// Reports
router.get("/reports", getReports);

export default router;
