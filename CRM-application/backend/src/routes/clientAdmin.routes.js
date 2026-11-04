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
    getProfile,
    updateProfile,
    updatePassword,
    getSettings,
    updateSettings,
    listFollowUps,
    createFollowUp,
    deleteFollowUp,
    updateFollowUp,
} from "../controllers/clientAdmin.controller.js";

import { requireClientAdmin, requireRoles } from "../middleware/authmiddleware.js";

const router = Router();

router.use(requireClientAdmin);

router.get(["/", "/dashboard", "/client-admin"], getDashboard);

router.get(["/leads", "/client-admin/leads"], listLeads);
router.post(["/leads", "/client-admin/leads"], createLead);
router.patch(["/leads/:id", "/client-admin/leads/:id"], updateLead);
router.delete(
  ["/leads/:id", "/client-admin/leads/:id"],
  requireRoles("ORGANIZATION_ADMIN", "MANAGER"),
  deleteLead
);

router.get(["/deals", "/client-admin/deals"], listDeals);
router.post(["/deals", "/client-admin/deals"], createDeal);
router.patch(["/deals/:id", "/client-admin/deals/:id"], updateDeal);
router.delete(
  ["/deals/:id", "/client-admin/deals/:id"],
  requireRoles("ORGANIZATION_ADMIN", "MANAGER"),
  deleteDeal
);

router.get(["/tasks", "/client-admin/tasks"], getTasks);
router.post(["/tasks", "/client-admin/tasks"], createTask);
router.patch(["/tasks/:id", "/client-admin/tasks/:id"], updateTask);
router.delete(
  ["/tasks/:id", "/client-admin/tasks/:id"],
  requireRoles("ORGANIZATION_ADMIN", "MANAGER"),
  deleteTask
);

router.get(["/team", "/client-admin/team"], getTeams);
router.post(["/team", "/client-admin/team"], createTeam);
router.patch(["/team/:id", "/client-admin/team/:id"], updateTeam);
router.delete(
  ["/team/:id", "/client-admin/team/:id"],
  requireRoles("ORGANIZATION_ADMIN", "MANAGER"),
  deleteTeam
);

router.get(["/products", "/client-admin/products"], listProducts);
router.post(
  ["/products", "/client-admin/products"],
  requireRoles("ORGANIZATION_ADMIN", "MANAGER"),
  createProduct
);
router.patch(["/products/:id", "/client-admin/products/:id"], updateProduct);
router.delete(
  ["/products/:id", "/client-admin/products/:id"],
  requireRoles("ORGANIZATION_ADMIN", "MANAGER"),
  deleteProduct
);

router.get(["/employee", "/client-admin/employee"], listEmployee);
router.post(
  ["/employee", "/client-admin/employee"],
  requireRoles("ORGANIZATION_ADMIN"),
  createEmployee
);
router.patch(
  ["/employee/:id", "/client-admin/employee/:id"],
  requireRoles("ORGANIZATION_ADMIN", "MANAGER"),
  updateEmployee
);
router.delete(
  ["/employee/:id", "/client-admin/employee/:id"],
  requireRoles("ORGANIZATION_ADMIN"),
  deleteEmployee
);

router.get(["/settings", "/client-admin/settings"], getSettings);
router.patch(["/settings", "/client-admin/settings"], updateSettings);
router.get(["/profile", "/client-admin/profile"], getProfile);
router.patch(["/profile", "/client-admin/profile"], updateProfile);
router.patch(["/password", "/client-admin/password"], updatePassword);

router.get("/followups", listFollowUps);
router.post("/followups", createFollowUp);
router.put("/followups/:id", updateFollowUp);
router.delete(
  "/followups/:id",
  requireRoles("ORGANIZATION_ADMIN", "MANAGER"),
  deleteFollowUp
);

export default router;
