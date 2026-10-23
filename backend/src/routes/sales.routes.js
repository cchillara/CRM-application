import { Router } from "express";
import { requireOrganization, requireRoles, requireUser } from "../middleware/authmiddleware.js";
import { convertSalesLead, createSalesLead, deleteSalesLead, getSalesLeadById, getSalesLeads, updateSalesLeadStatus, } from "../controllers/sales/salesLead.controller.js";
import { createSalesTask, deleteSalesTask, getSalesTasks, updateSalesTaskStatus } from "../controllers/sales/salesTask.controller.js";
import { getAllNotes, createNotes, editNotes, deleteNotes } from "../controllers/sales/salesNotes.controller.js";
import { getSalesProductById, getSalesProducts } from "../controllers/sales/salesProduct.controller.js";
import { getSalesAnalytics } from "../controllers/sales/salesAnalytics.controller.js";
import { getSalesNotifications, getSalesUnreadNotificationCount, markAllSalesNotificationsAsRead, markSalesNotificationAsRead } from "../controllers/sales/salesNotification.controller.js";
import { createSalesCustomer, getSalesCustomerById, getSalesCustomers, updateSalesCustomer } from "../controllers/sales/salesCustomer.controller.js";
import { createSalesCalendarEvent, deleteSalesCalendarEvent, getSalesCalendarEventById, getSalesCalendarEvents, updateSalesCalendarEvent } from "../controllers/sales/salesCalendar.controller.js";
import { getSalesProfile, updateSalesProfile } from "../controllers/sales/salesProfile.controller.js";
const router = Router();

router.use(requireUser, requireOrganization, requireRoles("SALES"));

router.get("/analytics", getSalesAnalytics);
router.get("/profile", getSalesProfile);
router.patch("/profile", updateSalesProfile);
router.get("/calendar/events", getSalesCalendarEvents);
router.get("/calendar/events/:taskId", getSalesCalendarEventById);
router.post("/calendar/events", createSalesCalendarEvent);
router.patch("/calendar/events/:taskId", updateSalesCalendarEvent);
router.delete("/calendar/events/:taskId", deleteSalesCalendarEvent);
router.get("/notifications", getSalesNotifications);
router.get("/notifications/unread-count", getSalesUnreadNotificationCount);
router.patch("/notifications/read-all", markAllSalesNotificationsAsRead);
router.patch("/notifications/:notificationId/read", markSalesNotificationAsRead);
router.get("/customers", getSalesCustomers);
router.get("/customers/:customerId", getSalesCustomerById);
router.post("/customers", createSalesCustomer);
router.patch("/customers/:customerId", updateSalesCustomer);
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


router.get("/notes", getAllNotes)
router.post("/notes", createNotes)
router.patch("/notes/:noteId", editNotes)
router.delete("/notes/:noteId", deleteNotes)
router.get("/products", getSalesProducts);
router.get("/products/:productId", getSalesProductById);
export default router;
