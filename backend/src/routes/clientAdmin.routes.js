import { Router } from "express";

import {
    getDashboard,
    listLeads,
    createLead,
    updateLead,
    deleteLead,
    listDeals,
    createDeal,
    updateDeal,
    deleteDeal,
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    getTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    listProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    listEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    updateProfile,
    updatePassword,
    getSettings,
    updateSettings,
} from "../controllers/clientAdmin.controller.js";

import { verifyFirebaseToken } from "../middleware/authmiddleware.js";

const router = Router();

/* Dashboard */
router.get(["/", "/dashboard", "/client-admin"], verifyFirebaseToken, getDashboard);

/* Leads (Leads.jsx) */
router.get(["/leads", "/client-admin/leads"], verifyFirebaseToken, listLeads);
router.post(["/leads", "/client-admin/leads"], verifyFirebaseToken, createLead);
router.patch(["/leads/:id", "/client-admin/leads/:id"], verifyFirebaseToken, updateLead);
router.delete(["/leads/:id", "/client-admin/leads/:id"], verifyFirebaseToken, deleteLead);

/* Deals (Deals.jsx) */
router.get(["/deals", "/client-admin/deals"], verifyFirebaseToken, listDeals);
router.post(["/deals", "/client-admin/deals"], verifyFirebaseToken, createDeal);
router.patch(["/deals/:id", "/client-admin/deals/:id"], verifyFirebaseToken, updateDeal);
router.delete(["/deals/:id", "/client-admin/deals/:id"], verifyFirebaseToken, deleteDeal);

/* Tasks (Tasks.jsx) */
router.get(["/tasks", "/client-admin/tasks"], verifyFirebaseToken, getTasks);
router.post(["/tasks", "/client-admin/tasks"], verifyFirebaseToken, createTask);
router.patch(["/tasks/:id", "/client-admin/tasks/:id"], verifyFirebaseToken, updateTask);
router.delete(["/tasks/:id", "/client-admin/tasks/:id"], verifyFirebaseToken, deleteTask);

/* Teams (Teams.jsx) */
router.get(["/team", "/client-admin/team"], verifyFirebaseToken, getTeams);
router.post(["/team", "/client-admin/team"], verifyFirebaseToken, createTeam);
router.patch(["/team/:id", "/client-admin/team/:id"], verifyFirebaseToken, updateTeam);
router.delete(["/team/:id", "/client-admin/team/:id"], verifyFirebaseToken, deleteTeam);

/* Products (Products.jsx) */
router.get(["/products", "/client-admin/products"], verifyFirebaseToken, listProducts);
router.post(["/products", "/client-admin/products"], verifyFirebaseToken, createProduct);
router.patch(["/products/:id", "/client-admin/products/:id"], verifyFirebaseToken, updateProduct);
router.delete(["/products/:id", "/client-admin/products/:id"], verifyFirebaseToken, deleteProduct);

/* Employees / Staff (Employee.jsx) */
router.get(["/employee", "/client-admin/employee"], verifyFirebaseToken, listEmployee);
router.post(["/employee", "/client-admin/employee"], verifyFirebaseToken, createEmployee);
router.patch(["/employee/:id", "/client-admin/employee/:id"], verifyFirebaseToken, updateEmployee);
router.delete(["/employee/:id", "/client-admin/employee/:id"], verifyFirebaseToken, deleteEmployee);

/* Settings, Profile & Password (Settings.jsx) */
router.get(["/settings", "/client-admin/settings"], verifyFirebaseToken, getSettings);
router.patch(["/settings", "/client-admin/settings"], verifyFirebaseToken, updateSettings);
router.patch(["/profile", "/client-admin/profile"], verifyFirebaseToken, updateProfile);
router.patch(["/password", "/client-admin/password"], verifyFirebaseToken, updatePassword);

/* Users Management */
// router.get("/users", verifyFirebaseToken, listUsers);
// router.get("/users/:id", verifyFirebaseToken, getUser);
// router.post("/users", verifyFirebaseToken, createUser);
// router.patch("/users/:id", verifyFirebaseToken, updateUser);
// router.patch("/users/:id/status", verifyFirebaseToken, updateUserStatus);
// router.delete("/users/:id", verifyFirebaseToken, deleteUser);

/* Roles */
// router.get("/roles", verifyFirebaseToken, listRoles);
// router.get("/roles/:id", verifyFirebaseToken, getRole);
// router.post("/roles", verifyFirebaseToken, createRole);
// router.patch("/roles/:id", verifyFirebaseToken, updateRole);
// router.delete("/roles/:id", verifyFirebaseToken, deleteRole);

// /* CRM Utilities & Reports */
// router.get("/customers", verifyFirebaseToken, listCustomers);
// router.get("/companies", verifyFirebaseToken, listCompanies);
// router.get("/reports", verifyFirebaseToken, getReports);

export default router;
