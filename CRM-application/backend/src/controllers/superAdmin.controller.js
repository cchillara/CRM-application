import { asyncHandler } from "../utils/asyncHandler.js";
import { randomUUID } from "node:crypto";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import prisma from "../db/index.js";
import { auth } from "../firebase-admin.js";

const defaultPlans = [
  { id: "starter", name: "Starter", price: 1499, billing: "Monthly", userLimit: 15, features: ["Leads and customers", "Deals and tasks", "Basic reports", "Email support"] },
  { id: "growth", name: "Growth", price: 3999, billing: "Monthly", userLimit: 50, features: ["Everything in Starter", "Team management", "Advanced reports", "CSV export", "Priority support"] },
  { id: "pro", name: "Pro", price: 8999, billing: "Monthly", userLimit: 200, features: ["Everything in Growth", "Advanced permissions", "Custom workflows", "API access", "Priority support"] },
];
const defaultSettings = { platformName: "SHNOOR CRM", supportEmail: "support@shnoor.com", allowSignup: true, emailAlerts: true, maintenanceMode: false, defaultPlanId: "starter" };
const sampleSupportTickets = [
  { id: "TICK-8091", subject: "SSO token refresh issue", category: "Login", priority: "HIGH", message: "Users are being asked to sign in again during the day. Please check token refresh behavior." },
  { id: "TICK-7984", subject: "CSV export request", category: "Reports", priority: "MEDIUM", message: "We need a clean CSV export for our quarterly reporting." },
  { id: "TICK-8022", subject: "Multi-currency invoice request", category: "Billing", priority: "MEDIUM", message: "Can billing support USD along with INR for our international customers?" },
  { id: "TICK-7916", subject: "Unable to invite a new teammate", category: "Users", priority: "HIGH", message: "The invite screen says the email is already registered, but this teammate cannot sign in. Can you check their account status?" },
  { id: "TICK-7860", subject: "Monthly report totals look incorrect", category: "Reports", priority: "LOW", message: "The September report total does not match the deals list. Please help us understand which date range the report uses." },
];

const mapPlan = (plan) => ({ ...plan, features: Array.isArray(plan.features) ? plan.features : [] });
const mapTicket = (ticket) => ({
  id: ticket.id,
  orgId: ticket.organizationId,
  subject: ticket.subject,
  category: ticket.category,
  priority: ticket.priority[0] + ticket.priority.slice(1).toLowerCase(),
  status: ticket.status === "REPLIED" ? "Replied" : "Open",
  createdAt: ticket.createdAt.toISOString(),
  message: ticket.message,
  replies: Array.isArray(ticket.replies) ? ticket.replies : [],
});

const getPlans = asyncHandler(async (req, res) => {
  if (await prisma.subscriptionPlan.count() === 0) {
    await prisma.subscriptionPlan.createMany({ data: defaultPlans.map((plan) => ({ ...plan, updatedAt: new Date() })), skipDuplicates: true });
  }
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { price: "asc" } });
  return res.status(200).json(new ApiResponse(200, plans.map(mapPlan), "Subscription plans fetched successfully"));
});

const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, price, billing, userLimit, features } = req.body;
  if (!name?.trim() || !Number.isFinite(Number(price)) || Number(price) < 0 || !["Monthly", "Quarterly", "Yearly"].includes(billing) || !Number.isInteger(Number(userLimit)) || Number(userLimit) < 1 || !Array.isArray(features)) {
    throw new ApiError(400, "Provide a valid plan name, price, billing cycle, user limit, and feature list");
  }
  const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Subscription plan not found");
  const updated = await prisma.subscriptionPlan.update({ where: { id }, data: { name: name.trim(), price: Number(price), billing, userLimit: Number(userLimit), features } });
  await writeAuditLog({ data: { action: "Subscription plan updated", entityType: "SubscriptionPlan", entityId: id, oldValues: { name: existing.name, price: existing.price }, newValues: { name: updated.name, price: updated.price } } });
  return res.status(200).json(new ApiResponse(200, mapPlan(updated), "Subscription plan updated successfully"));
});

const getPlatformSettings = asyncHandler(async (req, res) => {
  const record = await prisma.platformSettings.upsert({ where: { id: "global" }, create: { id: "global", settings: defaultSettings }, update: {} });
  return res.status(200).json(new ApiResponse(200, record.settings, "Platform settings fetched successfully"));
});

const updatePlatformSettings = asyncHandler(async (req, res) => {
  const input = req.body;
  if (!input || typeof input !== "object" || Array.isArray(input) || typeof input.platformName !== "string" || typeof input.supportEmail !== "string" || typeof input.allowSignup !== "boolean" || typeof input.emailAlerts !== "boolean" || typeof input.maintenanceMode !== "boolean" || typeof input.defaultPlanId !== "string") {
    throw new ApiError(400, "Invalid platform settings payload");
  }
  const settings = { ...defaultSettings, ...input };
  await prisma.platformSettings.upsert({ where: { id: "global" }, create: { id: "global", settings }, update: { settings } });
  await writeAuditLog({ data: { action: "Platform settings updated", entityType: "PlatformSettings", entityId: "global", newValues: settings } });
  return res.status(200).json(new ApiResponse(200, settings, "Platform settings updated successfully"));
});

const getSuperAdminProfile = asyncHandler(async (req, res) => {
  const identity = await auth.getUser(req.superAdmin.firebaseUid);
  const profile = {
    name: req.superAdmin.name || identity.displayName || "Super Admin",
    email: req.superAdmin.email,
    phone: req.superAdmin.phone || identity.phoneNumber || "",
    role: "SUPER_ADMIN",
    designation: req.superAdmin.designation || "Platform Administrator",
    passwordLastChangedAt: req.superAdmin.passwordLastChangedAt,
  };
  return res.status(200).json(new ApiResponse(200, profile, "Super Admin profile fetched successfully"));
});

const updateSuperAdminProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, designation } = req.body;
  if (!name?.trim() || !email?.trim()) throw new ApiError(400, "Name and email are required");
  const normalizedPhone = typeof phone === "string" ? phone.trim().replace(/[\s()-]/g, "") : "";
  if (normalizedPhone && !/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
    throw new ApiError(400, "Phone must be a valid E.164 number with at least 8 digits, for example +919876543210");
  }
  const identity = await auth.getUser(req.superAdmin.firebaseUid);
  const firebaseProfile = { displayName: name.trim(), email: email.trim(), ...(normalizedPhone ? { phoneNumber: normalizedPhone } : {}) };
  try {
    await auth.updateUser(req.superAdmin.firebaseUid, firebaseProfile);
  } catch (error) {
    const detail = `${error.code || ""} ${error.message || ""}`.toLowerCase();
    if (detail.includes("too_short") || detail.includes("phone-number-too-short") || detail.includes("invalid-phone-number")) {
      throw new ApiError(400, "Firebase rejected this phone number as too short or invalid. Enter a full international number such as +919876543210.");
    }
    throw error;
  }
  try {
    const updated = await prisma.superAdmin.update({ where: { id: req.superAdmin.id }, data: { name: name.trim(), email: email.trim(), phone: normalizedPhone || null, designation: designation?.trim() || null } });
    await writeAuditLog({ data: { action: "Super Admin profile updated", entityType: "SuperAdmin", entityId: updated.id, oldValues: { email: req.superAdmin.email }, newValues: { email: updated.email, name: updated.name } } });
    return res.status(200).json(new ApiResponse(200, { name: updated.name, email: updated.email, phone: updated.phone || "", role: "SUPER_ADMIN", designation: updated.designation || "Platform Administrator", passwordLastChangedAt: updated.passwordLastChangedAt }, "Profile updated successfully"));
  } catch (error) {
    await auth.updateUser(req.superAdmin.firebaseUid, { displayName: identity.displayName || undefined, email: identity.email, ...(identity.phoneNumber ? { phoneNumber: identity.phoneNumber } : {}) }).catch(() => {});
    throw error;
  }
});

const changeSuperAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new ApiError(503, "FIREBASE_WEB_API_KEY must be configured to securely verify the current password");
  if (!currentPassword || typeof newPassword !== "string" || newPassword.length < 8) throw new ApiError(400, "Enter the current password and a new password with at least 8 characters");
  let response;
  try {
    response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: req.superAdmin.email, password: currentPassword, returnSecureToken: true }),
    });
  } catch {
    throw new ApiError(503, "Firebase could not verify the current password. Check backend network access and try again.");
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firebaseError = result.error?.message || "";
    if (["API_KEY_INVALID", "API_KEY_EXPIRED", "PROJECT_NOT_FOUND", "OPERATION_NOT_ALLOWED"].includes(firebaseError)) {
      throw new ApiError(503, "Firebase password verification is not configured correctly. Check FIREBASE_WEB_API_KEY and Email/Password sign-in settings.");
    }
    throw new ApiError(400, "Current password is incorrect");
  }
  if (result.localId !== req.superAdmin.firebaseUid) throw new ApiError(403, "Firebase identity does not match the Super Admin account");
  await auth.updateUser(req.superAdmin.firebaseUid, { password: newPassword });
  await auth.revokeRefreshTokens(req.superAdmin.firebaseUid);
  const changedAt = new Date();
  await prisma.superAdmin.update({ where: { id: req.superAdmin.id }, data: { passwordLastChangedAt: changedAt } });
  await writeAuditLog({ data: { action: "Super Admin password changed", entityType: "SuperAdmin", entityId: req.superAdmin.id } });
  return res.status(200).json(new ApiResponse(200, { passwordLastChangedAt: changedAt }, "Password changed successfully"));
});

const getSupportTickets = asyncHandler(async (req, res) => {
  const tickets = await prisma.supportTicket.findMany({ include: { organization: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  return res.status(200).json(new ApiResponse(200, tickets.map((ticket) => ({ ...mapTicket(ticket), organizationName: ticket.organization?.name || "Platform" })), "Support tickets fetched successfully"));
});

const createSampleSupportTickets = asyncHandler(async (req, res) => {
  if (await prisma.supportTicket.count() === 0) {
    const organizations = await prisma.organization.findMany({ select: { id: true }, orderBy: { createdAt: "asc" } });
    await prisma.supportTicket.createMany({ data: sampleSupportTickets.map((ticket, index) => ({ ...ticket, organizationId: organizations[index % Math.max(organizations.length, 1)]?.id || null, status: "OPEN", replies: [], updatedAt: new Date(), createdAt: new Date(Date.now() - index * 3600000) })) });
  }
  const tickets = await prisma.supportTicket.findMany({ include: { organization: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  return res.status(200).json(new ApiResponse(200, tickets.map((ticket) => ({ ...mapTicket(ticket), organizationName: ticket.organization?.name || "Platform" })), "Sample support queries are ready"));
});

const replyToSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const message = req.body.message?.trim();
  if (!message) throw new ApiError(400, "Reply message is required");
  const existing = await prisma.supportTicket.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Support ticket not found");
  const replies = Array.isArray(existing.replies) ? existing.replies : [];
  const reply = { id: randomUUID(), by: req.superAdmin.name || req.superAdmin.email, message, createdAt: new Date().toISOString() };
  const updated = await prisma.supportTicket.update({ where: { id }, data: { status: "REPLIED", replies: [...replies, reply] } });
  await writeAuditLog({ data: { organizationId: updated.organizationId, action: "Support reply sent", entityType: "SupportTicket", entityId: id, newValues: { message } } });
  return res.status(201).json(new ApiResponse(201, mapTicket(updated), "Reply saved successfully"));
});

const writeAuditLog = (input) => prisma.auditLog.create(input);

const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    include: {
      organization: { select: { name: true } },
      actor: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const result = logs.map((log) => ({
    id: log.id,
    action: log.action,
    detail: log.organization?.name || log.newValues?.name || log.oldValues?.name || log.newValues?.email || log.oldValues?.email || (log.entityType === "Organization" ? "Organization" : `${log.entityType} ${log.entityId}`),
    actor: log.actor ? [log.actor.firstName, log.actor.lastName].filter(Boolean).join(" ") : "Super Admin",
    createdAt: log.createdAt,
  }));
  return res.status(200).json(new ApiResponse(200, result, "Audit logs fetched successfully"));
});

const getAllOrganizations = asyncHandler(async (req, res) => {
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          users: true,
          leads: true,
          deals: true,
          customers: true,
        },
      },
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, organizations, "Organizations fetched successfully"));
});

const getOrganizationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          leads: true,
          deals: true,
          customers: true,
          tasks: true,
          activities: true,
        },
      },
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, organization, "Organization details fetched successfully"));
});

const exportOrganizationUsersCsv = asyncHandler(async (req, res) => {
  const organization = await prisma.organization.findUnique({
    where: { id: req.params.id },
    select: {
      name: true,
      users: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!organization) throw new ApiError(404, "Organization not found");

  const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [
    ["User ID", "Name", "Email", "Phone", "Role", "Status", "Joined"],
    ...organization.users.map((user) => [
      user.id,
      [user.firstName, user.lastName].filter(Boolean).join(" "),
      user.email,
      "-",
      ({ ORGANIZATION_ADMIN: "ORG_ADMIN", SALES: "SALES_REP" })[user.role] || user.role,
      ({ ACTIVE: "Active", SUSPENDED: "Suspended", DEACTIVATED: "Deactivated", INVITED: "Pending" })[user.status] || user.status,
      user.createdAt.toISOString().slice(0, 10),
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const slug = organization.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "organization";

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${slug}-users.csv"`);
  return res.status(200).send(csv);
});

const createOrganization = asyncHandler(async (req, res) => {
  const { name, email, phone, website } = req.body;

  if (!name || name.trim() === "") {
    throw new ApiError(400, "Organization name is required");
  }

  const organization = await prisma.organization.create({
    data: {
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      website: website || null,
    },
  });
  await writeAuditLog({ data: { organizationId: organization.id, action: "Organization created", entityType: "Organization", entityId: organization.id, newValues: { name: organization.name, email: organization.email } } });

  return res
    .status(201)
    .json(new ApiResponse(201, organization, "Organization created successfully"));
});

const updateOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, website, status, planId, subscriptionStatus, paymentStatus, billingCycle, subscriptionAmount } = req.body;

  const existing = await prisma.organization.findUnique({ where: { id } });

  if (!existing) {
    throw new ApiError(404, "Organization not found");
  }

  const validSubscriptionStatuses = ["ACTIVE", "PENDING", "INACTIVE"];
  const validPaymentStatuses = ["PAID", "PENDING", "UNPAID", "FAILED"];
  if (subscriptionStatus !== undefined && !validSubscriptionStatuses.includes(subscriptionStatus)) {
    throw new ApiError(400, "Invalid subscription status");
  }
  if (paymentStatus !== undefined && !validPaymentStatuses.includes(paymentStatus)) {
    throw new ApiError(400, "Invalid payment status");
  }
  if (subscriptionAmount !== undefined && subscriptionAmount !== null && (!Number.isFinite(Number(subscriptionAmount)) || Number(subscriptionAmount) < 0)) {
    throw new ApiError(400, "Subscription amount must be a non-negative number");
  }

  const updated = await prisma.organization.update({
    where: { id },
    data: {
      name: name !== undefined ? name.trim() : existing.name,
      email: email !== undefined ? email : existing.email,
      phone: phone !== undefined ? phone : existing.phone,
      website: website !== undefined ? website : existing.website,
      status: status !== undefined ? status : existing.status,
      planId: planId !== undefined ? planId : existing.planId,
      subscriptionStatus: subscriptionStatus !== undefined ? subscriptionStatus : existing.subscriptionStatus,
      paymentStatus: paymentStatus !== undefined ? paymentStatus : existing.paymentStatus,
      billingCycle: billingCycle !== undefined ? billingCycle : existing.billingCycle,
      subscriptionAmount: subscriptionAmount !== undefined ? (subscriptionAmount === null ? null : Number(subscriptionAmount)) : existing.subscriptionAmount,
    },
  });
  await writeAuditLog({ data: { organizationId: id, action: "Organization updated", entityType: "Organization", entityId: id, oldValues: { name: existing.name, status: existing.status, email: existing.email, planId: existing.planId, subscriptionStatus: existing.subscriptionStatus, paymentStatus: existing.paymentStatus }, newValues: { name: updated.name, status: updated.status, email: updated.email, planId: updated.planId, subscriptionStatus: updated.subscriptionStatus, paymentStatus: updated.paymentStatus } } });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Organization updated successfully"));
});

const deleteOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Organization not found");

  try {
    await prisma.organization.delete({ where: { id } });
  } catch (error) {
    if (error.code === "P2003") {
      throw new ApiError(409, "Organization cannot be deleted while it has related CRM records");
    }
    throw error;
  }
  await writeAuditLog({ data: { action: "Organization deleted", entityType: "Organization", entityId: id, oldValues: { name: existing.name, status: existing.status } } });

  return res.status(200).json(new ApiResponse(200, existing, "Organization deleted successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  const { organizationId } = req.params;
  if (!organizationId || !firstName?.trim() || !email?.trim() || !password) {
    throw new ApiError(400, "Organization, first name, email, and temporary password are required");
  }
  if (password.length < 8) throw new ApiError(400, "Temporary password must be at least 8 characters");
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!organization) throw new ApiError(404, "Organization not found");
  const validRoles = ["ORGANIZATION_ADMIN", "MANAGER", "SALES"];
  if (role && !validRoles.includes(role)) throw new ApiError(400, "Invalid role specified");

  let firebaseUser;
  let databaseUserCreated = false;
  try {
    firebaseUser = await auth.createUser({ email: email.trim(), password, displayName: [firstName.trim(), lastName?.trim()].filter(Boolean).join(" ") });
    const user = await prisma.$transaction(async (tx) => {
      if (role === "ORGANIZATION_ADMIN") {
        await tx.user.updateMany({ where: { organizationId, role: "ORGANIZATION_ADMIN" }, data: { role: "MANAGER" } });
      }
      return tx.user.create({
        data: {
          firebaseUid: firebaseUser.uid,
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName?.trim() || null,
          role: role || "SALES",
          status: "INVITED",
          organizationId,
        },
      });
    });
    databaseUserCreated = true;
    await writeAuditLog({ data: { organizationId, action: "User created", entityType: "User", entityId: user.id, newValues: { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } } });
    return res.status(201).json(new ApiResponse(201, user, "User created successfully"));
  } catch (error) {
    if (firebaseUser?.uid && !databaseUserCreated) await auth.deleteUser(firebaseUser.uid).catch(() => {});
    if (error.code === "auth/email-already-exists" || error.code === "P2002") throw new ApiError(409, "A user with this email already exists");
    throw error;
  }
});

const assignUserOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { organizationId, role } = req.body;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (organizationId) {
    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }
  }

  const validRoles = ["ORGANIZATION_ADMIN", "MANAGER", "SALES"];
  if (role && !validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const targetOrganizationId = organizationId !== undefined ? organizationId : user.organizationId;
  const targetRole = role !== undefined ? role : user.role;
  const updatedUser = targetRole === "ORGANIZATION_ADMIN" && targetOrganizationId
    ? await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { organizationId: targetOrganizationId, role: "ORGANIZATION_ADMIN", id: { not: id } },
        data: { role: "MANAGER" },
      });
      return tx.user.update({ where: { id }, data: { organizationId: targetOrganizationId, role: targetRole } });
    })
    : await prisma.user.update({
      where: { id },
      data: { organizationId: targetOrganizationId, role: targetRole },
    });
  await writeAuditLog({ data: { organizationId: updatedUser.organizationId, action: "User assigned", entityType: "User", entityId: id, oldValues: { organizationId: user.organizationId, role: user.role }, newValues: { organizationId: updatedUser.organizationId, role: updatedUser.role, email: updatedUser.email } } });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User assigned successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, role, status } = req.body;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "User not found");

  const validRoles = ["ORGANIZATION_ADMIN", "MANAGER", "SALES"];
  const validStatuses = ["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"];
  if (role !== undefined && !validRoles.includes(role)) throw new ApiError(400, "Invalid role specified");
  if (status !== undefined && !validStatuses.includes(status)) throw new ApiError(400, "Invalid status specified");

  const updateData = {
    firstName: firstName !== undefined ? firstName.trim() : existing.firstName,
    lastName: lastName !== undefined ? (lastName.trim() || null) : existing.lastName,
    email: email !== undefined ? email.trim() : existing.email,
    role: role !== undefined ? role : existing.role,
    status: status !== undefined ? status : existing.status,
  };
  const firebaseProfile = {
    email: updateData.email,
    displayName: [updateData.firstName, updateData.lastName].filter(Boolean).join(" "),
  };
  const previousFirebaseProfile = {
    email: existing.email,
    displayName: [existing.firstName, existing.lastName].filter(Boolean).join(" "),
  };
  const firebaseChanged = firebaseProfile.email !== previousFirebaseProfile.email || firebaseProfile.displayName !== previousFirebaseProfile.displayName;
  if (firebaseChanged) await auth.updateUser(existing.firebaseUid, firebaseProfile);

  let updatedUser;
  try {
    updatedUser = updateData.role === "ORGANIZATION_ADMIN" && existing.organizationId
      ? await prisma.$transaction(async (tx) => {
        await tx.user.updateMany({ where: { organizationId: existing.organizationId, role: "ORGANIZATION_ADMIN", id: { not: id } }, data: { role: "MANAGER" } });
        return tx.user.update({ where: { id }, data: updateData });
      })
      : await prisma.user.update({ where: { id }, data: updateData });
  } catch (error) {
    if (firebaseChanged) await auth.updateUser(existing.firebaseUid, previousFirebaseProfile).catch(() => {});
    throw error;
  }
  await writeAuditLog({ data: { organizationId: updatedUser.organizationId, action: "User updated", entityType: "User", entityId: id, oldValues: { firstName: existing.firstName, lastName: existing.lastName, email: existing.email, role: existing.role, status: existing.status }, newValues: { firstName: updatedUser.firstName, lastName: updatedUser.lastName, email: updatedUser.email, role: updatedUser.role, status: updatedUser.status } } });
  return res.status(200).json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "User not found");

  try {
    await prisma.user.delete({ where: { id } });
  } catch (error) {
    if (error.code === "P2003") throw new ApiError(409, "User cannot be deleted while assigned to CRM records");
    throw error;
  }
  await auth.deleteUser(existing.firebaseUid).catch((error) => {
    if (error.code !== "auth/user-not-found") console.error("Failed to remove Firebase identity for deleted CRM user:", error.code);
  });
  await writeAuditLog({ data: { organizationId: existing.organizationId, action: "User deleted", entityType: "User", entityId: id, oldValues: { firstName: existing.firstName, lastName: existing.lastName, email: existing.email, role: existing.role } } });
  return res.status(200).json(new ApiResponse(200, existing, "User deleted successfully"));
});

export {
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
  getAuditLogs,
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
};
