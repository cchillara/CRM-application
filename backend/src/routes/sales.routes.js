import { Router } from "express";
import {requireOrganization,requireRoles,requireUser} from "../middleware/authmiddleware.js";
import { convertSalesLead, createSalesLead, deleteSalesLead, getSalesLeadById, getSalesLeads, updateSalesLeadStatus,} from "../controllers/salesLead.controller.js";
import { createSalesTask, deleteSalesTask, getSalesTasks, updateSalesTaskStatus } from "../controllers/salesTask.controller.js";
import { getAllNotes,createNotes,editNotes,deleteNotes } from "../controllers/salesNotes.controller.js";
import { getSalesProductById, getSalesProducts } from "../controllers/salesProduct.controller.js";
import { getSalesAnalytics } from "../controllers/salesAnalytics.controller.js";
const router = Router();

router.use(requireUser, requireOrganization, requireRoles("SALES"));

router.get("/analytics", getSalesAnalytics);
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


router.get("/notes",getAllNotes)
router.post("/notes",createNotes)
router.patch("/notes/:noteId",editNotes)
router.delete("/notes/:noteId",deleteNotes)
router.get("/products", getSalesProducts);
router.get("/products/:productId", getSalesProductById);
export default router;
