import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/index.js";

const send = (res, status, data, message) =>
  res.status(status).json(new ApiResponse(status, data, message));

const leadStatusFromInput = (status) => ({
  New: "NEW",
  Contacted: "CONTACTED",
  Qualified: "QUALIFIED",
  Proposal: "QUALIFIED",
  Lost: "UNQUALIFIED",
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  QUALIFIED: "QUALIFIED",
  UNQUALIFIED: "UNQUALIFIED",
  CONVERTED: "CONVERTED",
}[status]);

const leadStatusForPortal = (status) => ({
  NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified",
  UNQUALIFIED: "Lost", CONVERTED: "Won",
}[status] || status);

const dealStageFromInput = (stage) => ({
  New: "PROSPECTING", Qualified: "QUALIFICATION", Proposal: "PROPOSAL",
  Negotiation: "NEGOTIATION", Won: "WON", Lost: "LOST",
  PROSPECTING: "PROSPECTING", QUALIFICATION: "QUALIFICATION", PROPOSAL: "PROPOSAL",
  NEGOTIATION: "NEGOTIATION", WON: "WON", LOST: "LOST",
}[stage]);

const dealStageForPortal = (stage) => ({
  PROSPECTING: "New", QUALIFICATION: "Qualified", PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation", WON: "Won", LOST: "Lost",
}[stage] || stage);

const mapLead = (lead) => ({
  ...lead,
  name: lead.title,
  company: lead.company?.name || lead.customer?.company?.name || "",
  contactName: lead.contact ? [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(" ") : "",
  email: lead.contact?.email || "",
  source: lead.source,
  status: leadStatusForPortal(lead.status),
});

const mapDeal = (deal) => ({
  ...deal,
  name: deal.title,
  company: deal.customer?.company?.name || "",
  value: deal.value === null ? 0 : Number(deal.value),
  stage: dealStageForPortal(deal.stage),
});

const mapTask = (task) => ({
  ...task,
  due: task.dueDate?.toISOString() || "",
  priority: task.priority?.toLowerCase().replace(/^./, (letter) => letter.toUpperCase()) || "Medium",
  completed: task.status === "COMPLETED",
});

const validateTaskPriority = (priority) => ["LOW", "MEDIUM", "HIGH"].includes(String(priority).toUpperCase());
const validateTaskTime = (time) => time == null || time === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
// Every data endpoint is scoped to the authenticated CRM user. Include the
// organization when available as an additional tenant boundary, but allow
// invited standalone users to access their own assigned records as well.
const userDataScope = (req) => ({
  assignedToId: req.user.id,
  ...(req.organizationId ? { organizationId: req.organizationId } : {}),
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { organization: { select: { name: true } } },
  });
  if (!user) throw new ApiError(404, "User not found");
  return send(res, 200, {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
    email: user.email,
    role: user.role,
    orgName: user.organization?.name || "",
    phone: user.phone || "",
    designation: user.designation || "",
  }, "Profile retrieved successfully");
});

export const updateProfile = asyncHandler(async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name) throw new ApiError(400, "Name is required");
  if (req.body.email !== undefined && (typeof req.body.email !== "string" || req.body.email.toLowerCase() !== req.user.email.toLowerCase())) {
    throw new ApiError(400, "Email address cannot be changed here");
  }
  for (const field of ["phone", "designation"]) {
    if (req.body[field] !== undefined && req.body[field] !== null && typeof req.body[field] !== "string") {
      throw new ApiError(400, `${field} must be a string`);
    }
  }
  const [firstName, ...lastName] = name.split(/\s+/);
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      firstName,
      lastName: lastName.join(" ") || null,
      ...(req.body.phone !== undefined && { phone: req.body.phone?.trim() || null }),
      ...(req.body.designation !== undefined && { designation: req.body.designation?.trim() || null }),
    },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, designation: true, role: true, organization: { select: { name: true } } },
  });
  return send(res, 200, {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
    email: user.email,
    role: user.role,
    orgName: user.organization?.name || "",
    phone: user.phone || "",
    designation: user.designation || "",
  }, "Profile updated successfully");
});

export const listMyLeads = asyncHandler(async (req, res) => {
  const leads = await prisma.lead.findMany({
    where: userDataScope(req),
    include: { company: true, customer: { include: { company: true } }, contact: true },
    orderBy: { updatedAt: "desc" },
  });
  return send(res, 200, leads.map(mapLead), "Assigned leads retrieved successfully");
});

export const updateMyLead = asyncHandler(async (req, res) => {
  const status = leadStatusFromInput(req.body.status);
  if (!status) throw new ApiError(400, "Invalid lead status");
  const result = await prisma.lead.updateMany({
    where: { id: req.params.id, ...userDataScope(req) },
    data: { status },
  });
  if (!result.count) throw new ApiError(404, "Assigned lead not found");
  const lead = await prisma.lead.findUnique({ where: { id: req.params.id }, include: { company: true, customer: { include: { company: true } }, contact: true } });
  return send(res, 200, mapLead(lead), "Lead updated successfully");
});

export const listMyDeals = asyncHandler(async (req, res) => {
  const deals = await prisma.deal.findMany({
    where: userDataScope(req),
    include: { customer: { include: { company: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return send(res, 200, deals.map(mapDeal), "Assigned deals retrieved successfully");
});

export const updateMyDeal = asyncHandler(async (req, res) => {
  const stage = dealStageFromInput(req.body.stage);
  if (!stage) throw new ApiError(400, "Invalid deal stage");
  const result = await prisma.deal.updateMany({
    where: { id: req.params.id, ...userDataScope(req) },
    data: { stage },
  });
  if (!result.count) throw new ApiError(404, "Assigned deal not found");
  const deal = await prisma.deal.findUnique({ where: { id: req.params.id }, include: { customer: { include: { company: true } } } });
  return send(res, 200, mapDeal(deal), "Deal updated successfully");
});

export const listMyTasks = asyncHandler(async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: userDataScope(req),
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
  return send(res, 200, tasks.map(mapTask), "Tasks retrieved successfully");
});

export const createMyTask = asyncHandler(async (req, res) => {
  if (!req.organizationId) throw new ApiError(403, "Assign this user to an organization before creating tasks");
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  if (!title) throw new ApiError(400, "Task title is required");
  const allowedStatuses = ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  const status = req.body.status || "TODO";
  if (!allowedStatuses.includes(status)) throw new ApiError(400, "Invalid task status");
  const dueValue = req.body.dueDate || req.body.due || null;
  const dueDate = dueValue ? new Date(dueValue) : null;
  if (dueDate && Number.isNaN(dueDate.getTime())) throw new ApiError(400, "Invalid task due date");
  const priority = String(req.body.priority || "MEDIUM").toUpperCase();
  if (!validateTaskPriority(priority)) throw new ApiError(400, "Invalid task priority");
  if (!validateTaskTime(req.body.time)) throw new ApiError(400, "Task time must use HH:MM format");
  const task = await prisma.task.create({
    data: { title, description: req.body.description || null, status, dueDate, priority, time: req.body.time || null, organizationId: req.organizationId, assignedToId: req.user.id },
  });
  return send(res, 201, mapTask(task), "Task created successfully");
});

export const updateMyTask = asyncHandler(async (req, res) => {
  const data = {};
  if (req.body.title !== undefined) {
    if (typeof req.body.title !== "string" || !req.body.title.trim()) throw new ApiError(400, "Task title cannot be empty");
    data.title = req.body.title.trim();
  }
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.priority !== undefined) {
    if (!validateTaskPriority(req.body.priority)) throw new ApiError(400, "Invalid task priority");
    data.priority = String(req.body.priority).toUpperCase();
  }
  if (req.body.time !== undefined) {
    if (!validateTaskTime(req.body.time)) throw new ApiError(400, "Task time must use HH:MM format");
    data.time = req.body.time || null;
  }
  if (req.body.status !== undefined || req.body.completed !== undefined) {
    const status = req.body.status ?? (req.body.completed ? "COMPLETED" : "TODO");
    if (!["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)) throw new ApiError(400, "Invalid task status");
    data.status = status;
  }
  if (req.body.dueDate !== undefined || req.body.due !== undefined) {
    const dueValue = req.body.dueDate ?? req.body.due;
    const dueDate = dueValue ? new Date(dueValue) : null;
    if (dueDate && Number.isNaN(dueDate.getTime())) throw new ApiError(400, "Invalid task due date");
    data.dueDate = dueDate;
  }
  if (!Object.keys(data).length) throw new ApiError(400, "No task fields provided");
  const result = await prisma.task.updateMany({
    where: { id: req.params.id, ...userDataScope(req) }, data,
  });
  if (!result.count) throw new ApiError(404, "Task not found");
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  return send(res, 200, mapTask(task), "Task updated successfully");
});

export const deleteMyTask = asyncHandler(async (req, res) => {
  const result = await prisma.task.deleteMany({
    where: { id: req.params.id, ...userDataScope(req) },
  });
  if (!result.count) throw new ApiError(404, "Task not found");
  return send(res, 200, null, "Task deleted successfully");
});

export const getMyReports = asyncHandler(async (req, res) => {
  const [leads, deals, tasks] = await Promise.all([
    prisma.lead.findMany({ where: userDataScope(req), select: { status: true } }),
    prisma.deal.findMany({ where: userDataScope(req), select: { stage: true, value: true } }),
    prisma.task.groupBy({ by: ["status"], where: userDataScope(req), _count: { _all: true } }),
  ]);
  const openDeals = deals.filter(({ stage }) => !["WON", "LOST"].includes(stage));
  return send(res, 200, {
    leads: { total: leads.length, qualified: leads.filter(({ status }) => status === "QUALIFIED").length },
    deals: { total: deals.length, open: openDeals.length, pipelineValue: openDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0), wonRevenue: deals.filter(({ stage }) => stage === "WON").reduce((sum, deal) => sum + Number(deal.value || 0), 0) },
    tasks: Object.fromEntries(tasks.map(({ status, _count }) => [status, _count._all])),
  }, "Reports retrieved successfully");
});

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id, ...(req.organizationId ? { organizationId: req.organizationId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return send(res, 200, notifications, "Notifications retrieved successfully");
});

export const markMyNotificationRead = asyncHandler(async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id, ...(req.organizationId ? { organizationId: req.organizationId } : {}) },
    data: { isRead: true },
  });
  if (!result.count) throw new ApiError(404, "Notification not found");
  const notification = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user.id, ...(req.organizationId ? { organizationId: req.organizationId } : {}) },
  });
  return send(res, 200, notification, "Notification marked as read");
});

export const createSupportTicket = asyncHandler(async (req, res) => {
  const subject = typeof req.body.subject === "string" ? req.body.subject.trim() : "";
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  const category = typeof req.body.category === "string" ? req.body.category.trim() : "General";
  const priority = typeof req.body.priority === "string" ? req.body.priority.toUpperCase() : "NORMAL";
  if (!subject || !message) throw new ApiError(400, "Subject and message are required");
  if (!["LOW", "NORMAL", "HIGH", "URGENT"].includes(priority)) throw new ApiError(400, "Invalid ticket priority");
  const ticket = await prisma.supportTicket.create({
    data: { organizationId: req.user.organizationId || null, subject, message, category, priority },
    select: { id: true, subject: true, category: true, priority: true, status: true, createdAt: true },
  });
  return send(res, 201, ticket, "Support request submitted successfully");
});
