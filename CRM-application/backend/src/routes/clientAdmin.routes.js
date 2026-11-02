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
    listCustomers,
    listCompanies,
    listDeals,
    getReports,
} from "../controllers/clientAdmin.controller.js";

import { verifyFirebaseToken } from "../middleware/authmiddleware.js";

const router = Router();

router.get("/users", verifyFirebaseToken, listUsers);
router.get("/users/:id", verifyFirebaseToken, getUser);
router.post("/users", verifyFirebaseToken, createUser);
router.patch("/users/:id", verifyFirebaseToken, updateUser);
router.patch("/users/:id/status", verifyFirebaseToken, updateUserStatus);
router.delete("/users/:id", verifyFirebaseToken, deleteUser);

router.get("/roles", verifyFirebaseToken, listRoles);
router.get("/roles/:id", verifyFirebaseToken, getRole);
router.post("/roles", verifyFirebaseToken, createRole);
router.patch("/roles/:id", verifyFirebaseToken, updateRole);
router.delete("/roles/:id", verifyFirebaseToken, deleteRole);

router.get("/leads", verifyFirebaseToken, listLeads);
router.get("/customers", verifyFirebaseToken, listCustomers);
router.get("/companies", verifyFirebaseToken, listCompanies);
router.get("/deals", verifyFirebaseToken, listDeals);

router.get("/reports", verifyFirebaseToken, getReports);

export default router;
