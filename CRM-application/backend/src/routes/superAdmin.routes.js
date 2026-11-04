import { Router } from "express";
import {
  getAllOrganizations,
  getOrganizationById,
  exportOrganizationUsersCsv,
  createOrganization,
  updateOrganization,
  getAllUsers,
  createUser,
  assignUserOrganization,
  updateUser,
  deleteUser,
  deleteOrganization,
  getAuditLogs,
  getPlans,
  updatePlan,
  getPlatformSettings,
  updatePlatformSettings,
  getSuperAdminProfile,
  updateSuperAdminProfile,
  changeSuperAdminPassword,
  getSupportTickets,
  createSampleSupportTickets,
  replyToSupportTicket,
} from "../controllers/superAdmin.controller.js";
import { requireSuperAdmin } from "../middleware/authmiddleware.js";

const router = Router();

router.use(requireSuperAdmin);

router.get("/organizations", getAllOrganizations);
router.post("/organizations", createOrganization);
router.get("/organizations/:id", getOrganizationById);
router.get("/organizations/:id/users/export", exportOrganizationUsersCsv);
router.put("/organizations/:id", updateOrganization);
router.delete("/organizations/:id", deleteOrganization);
router.get("/users", getAllUsers);
router.post("/organizations/:organizationId/users", createUser);
router.get("/audit-logs", getAuditLogs);
router.get("/plans", getPlans);
router.put("/plans/:id", updatePlan);
router.get("/settings", getPlatformSettings);
router.put("/settings", updatePlatformSettings);
router.get("/profile", getSuperAdminProfile);
router.patch("/profile", updateSuperAdminProfile);
router.post("/security/change-password", changeSuperAdminPassword);
router.get("/support/tickets", getSupportTickets);
router.post("/support/sample-tickets", createSampleSupportTickets);
router.post("/support/tickets/:id/replies", replyToSupportTicket);
router.patch("/users/:id/assign", assignUserOrganization);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
                                                                                                                                      
