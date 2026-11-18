import { Router } from "express";
import {
  getProfile,
  updateProfile,
  listMyLeads,
  updateMyLead,
  listMyDeals,
  updateMyDeal,
  listMyTasks,
  createMyTask,
  updateMyTask,
  deleteMyTask,
  getMyReports,
  getMyNotifications,
  markMyNotificationRead,
  createSupportTicket,
} from "../controllers/userPortal.controller.js";
import { requireRoles, requireUser } from "../middleware/authmiddleware.js";

const router = Router();
router.use(requireUser, requireRoles("USER"));

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.get("/leads", listMyLeads);
router.patch("/leads/:id", updateMyLead);
router.get("/deals", listMyDeals);
router.patch("/deals/:id", updateMyDeal);
router.get("/tasks", listMyTasks);
router.post("/tasks", createMyTask);
router.patch("/tasks/:id", updateMyTask);
router.delete("/tasks/:id", deleteMyTask);
router.get("/reports", getMyReports);
router.get("/notifications", getMyNotifications);
router.patch("/notifications/:id/read", markMyNotificationRead);
router.post("/support-tickets", createSupportTicket);

export default router;
