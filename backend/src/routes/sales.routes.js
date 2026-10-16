import { Router } from "express";
import {requireOrganization,requireRoles,requireUser} from "../middleware/authmiddleware.js";
import { convertSalesLead, createSalesLead, deleteSalesLead, getSalesLeadById, getSalesLeads, updateSalesLeadStatus,} from "../controllers/salesLead.controller.js";
import { createSalesTask, deleteSalesTask, getSalesTasks, updateSalesTaskStatus } from "../controllers/salesTask.controller.js";

const router = Router();

router.use(requireUser, requireOrganization, requireRoles("SALES"));

router.get("/leads", getSalesLeads);
router.post("/leads", createSalesLead);
router.get("/leads/:leadId", getSalesLeadById);
router.patch("/leads/:leadId/status", updateSalesLeadStatus);
router.delete("/leads/:leadId", deleteSalesLead);
router.post("/leads/:leadId/convert", convertSalesLead);
router.get("/tasks", getSalesTasks);
router.post("/tasks", createSalesTask);
router.patch("/tasks/:taskId/status", updateSalesTaskStatus);
router.delete("/tasks/:taskId", deleteSalesTask);

export default router;
