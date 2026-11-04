import { Router } from "express";
import { requireOrganization, requireRoles, requireUser } from "../middleware/authmiddleware.js";
import {
    convertSalesLead,
    createSalesLead,
    deleteSalesLead,
    getSalesLeadById,
    getSalesLeads,
    updateSalesLeadStatus,
} from "../controllers/sales/salesLead.controller.js";
import {
    createSalesCustomer,
    getSalesCustomerById,
    getSalesCustomers,
    updateSalesCustomer,
} from "../controllers/sales/salesCustomer.controller.js";
import {
    createSalesTask,
    deleteSalesTask,
    getSalesTasks,
    updateSalesTaskStatus,
} from "../controllers/sales/salesTask.controller.js";
import { createNotes, deleteNotes, editNotes, getAllNotes } from "../controllers/sales/salesNotes.controller.js";
import {
    getManagerAnalytics,
    getManagerActivities,
    getManagerDashboard,
    getManagerReport,
    getManagerTeamMembers,
    getManagerTeams,
} from "../controllers/manager.controller.js";

const router = Router();

router.use(requireUser, requireOrganization, requireRoles("MANAGER"));

router.get("/dashboard", getManagerDashboard);
router.get("/teams", getManagerTeams);
router.get("/team-members", getManagerTeamMembers);
router.get("/analytics", getManagerAnalytics);
router.get("/reports", getManagerReport);
router.get("/activities", getManagerActivities);

router.get("/leads", getSalesLeads);
router.post("/leads", createSalesLead);
router.get("/leads/:leadId", getSalesLeadById);
router.patch("/leads/:leadId/status", updateSalesLeadStatus);
router.delete("/leads/:leadId", deleteSalesLead);
router.post("/leads/:leadId/convert", convertSalesLead);

router.get("/customers", getSalesCustomers);
router.get("/customers/:customerId", getSalesCustomerById);
router.post("/customers", createSalesCustomer);
router.patch("/customers/:customerId", updateSalesCustomer);

router.get("/tasks", getSalesTasks);
router.post("/tasks", createSalesTask);
router.patch("/tasks/:taskId/status", updateSalesTaskStatus);
router.delete("/tasks/:taskId", deleteSalesTask);

router.get("/notes", getAllNotes);
router.post("/notes", createNotes);
router.patch("/notes/:noteId", editNotes);
router.delete("/notes/:noteId", deleteNotes);

export default router;
