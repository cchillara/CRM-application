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

import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } from "../controllers/followUp.controller.js";
import { requireClientAdmin } from "../middleware/authmiddleware.js";

const router = Router();

router.use(requireClientAdmin);

router.get("/settings", getSettings);
router.patch("/settings", updateSettings);

router.get("/followups", getFollowUps);
router.post("/followups", createFollowUp);
router.put("/followups/:id", updateFollowUp);
router.delete("/followups/:id", deleteFollowUp);

router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

router.get("/roles", listRoles);
router.get("/roles/:id", getRole);
router.post("/roles", createRole);
router.patch("/roles/:id", updateRole);
router.delete("/roles/:id", deleteRole);

router.get("/leads", listLeads);
router.post("/leads", createLead);
router.patch("/leads/:id", updateLead);
router.delete("/leads/:id", deleteLead);

router.get("/customers", listCustomers);
router.patch("/customers/:id", updateCustomer);
router.delete("/customers/:id", deleteCustomer);
router.get("/companies", listCompanies);
router.get("/deals", listDeals);

router.get("/tasks", listTasks);
router.post("/tasks", createTask);
router.patch("/tasks/:taskId", updateTask);
router.delete("/tasks/:taskId", deleteTask);


router.get("/reports", getReports);

export default router;
