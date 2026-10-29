import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/index.js";
import { auth } from "../firebase-admin.js";

const defaultPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 1499,
    billing: "Monthly",
    userLimit: 15,
    features: ["Leads and customers", "Deals and tasks", "Basic reports", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 3999,
    billing: "Monthly",
    userLimit: 50,
    features: ["Everything in Starter", "Team management", "Advanced reports", "CSV export", "Priority support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 8999,
    billing: "Monthly",
    userLimit: 200,
    features: ["Everything in Growth", "Advanced permissions", "Custom workflows", "API access", "Priority support"],
  },
];

const defaultSettings = {
  platformName: "SHNOOR CRM",
  supportEmail: "support@shnoor.com",
  allowSignup: true,
  emailAlerts: true,
  maintenanceMode: false,
  defaultPlanId: "starter",
  newOrganizationAlerts: true,
  failedPaymentAlerts: true,
  weeklySummaryEmail: false,
};

const sampleTickets = [
  {
    id: "TICK-8091",
    subject: "SSO token refresh issue",
    category: "Login",
    priority: "HIGH",
    message: "Users are being asked to sign in again during the day. Please check token refresh behavior.",
  },
  {
    id: "TICK-7984",
    subject: "CSV export request",
    category: "Reports",
    priority: "MEDIUM",
    message: "We need a clean CSV export for our quarterly reporting.",
  },
  {
    id: "TICK-8022",
    subject: "Multi-currency invoice request",
    category: "Billing",
    priority: "MEDIUM",
    message: "Can billing support USD along with INR for our international customers?",
  },
  {
    id: "TICK-7916",
    subject: "Unable to invite a new teammate",
    category: "Users",
    priority: "HIGH",
    message: "The invite screen says the email is already registered, but this teammate cannot sign in. Can you check their account status?",
  },
  {
    id: "TICK-7860",
    subject: "Monthly report totals look incorrect",
    category: "Reports",
    priority: "LOW",
    message: "The September report total does not match the deals list. Please help us understand which date range the report uses.",
  },
];

const validPlanBilling = ["Monthly", "Quarterly", "Yearly"];
const validSubscriptionStatuses = ["ACTIVE", "PENDING", "INACTIVE"];
const validPaymentStatuses = ["PAID", "PENDING", "UNPAID", "FAILED"];
const validOrganizationStatuses = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];
const validUserRoles = ["ORGANIZATION_ADMIN", "MANAGER", "SALES"];
const validUserStatuses = ["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"];

const writeAuditLog = (data, db = prisma) => db.auditLog.create({ data });
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isText = (value) => typeof value === "string";
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function mapPlan(plan) {
  return {
    ...plan,
    features: Array.isArray(plan.features) ? plan.features : [],
  };
}

function mapTicket(ticket) {
  const priority = String(ticket.priority || "LOW");

  return {
    id: ticket.id,
    orgId: ticket.organizationId,
    subject: ticket.subject,
    category: ticket.category,
    priority: priority[0].toUpperCase() + priority.slice(1).toLowerCase(),
    status: ticket.status === "REPLIED" ? "Replied" : "Open",
    createdAt: ticket.createdAt.toISOString(),
    message: ticket.message,
    replies: Array.isArray(ticket.replies) ? ticket.replies : [],
  };
}

function mapSupportTicket(ticket) {
  return {
    ...mapTicket(ticket),
    organizationName: ticket.organization?.name || "Platform",
  };
}

function getTicketReply(req) {
  return typeof req.body?.message === "string" ? req.body.message.trim() : "";
}

// Organizations
export const getAllOrganizations = asyncHandler(async (req, res) => {
  const orgs = await prisma.organization.findMany({
    include: {
      _count: {
        select: { users: true, leads: true, deals: true, customers: true },
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
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(
    new ApiResponse(200, orgs, "Organizations fetched successfully"),
  );
});

export const createOrganization = asyncHandler(async (req, res) => {
  const { name, email, phone, website } = req.body || {};

  if (typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Organization name is required");
  }
  if (email != null && (!isText(email) || (email && !isEmail(email)))) {
    throw new ApiError(400, "Provide a valid organization email");
  }
  if (phone != null && !isText(phone)) throw new ApiError(400, "Phone must be text");
  if (website != null && !isText(website)) throw new ApiError(400, "Website must be text");

  const org = await prisma.$transaction(async (tx) => {
    const created = await tx.organization.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        website: website?.trim() || null,
      },
    });

    await writeAuditLog({
      organizationId: created.id,
      action: "Organization created",
      entityType: "Organization",
      entityId: created.id,
      newValues: { name: created.name, email: created.email },
    }, tx);

    return created;
  });

  return res.status(201).json(
    new ApiResponse(201, org, "Organization created successfully"),
  );
});

export const getOrganizationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const org = await prisma.organization.findUnique({
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
        select: { leads: true, deals: true, customers: true, tasks: true, activities: true },
      },
    },
  });

  if (!org) throw new ApiError(404, "Organization not found");

  return res.status(200).json(
    new ApiResponse(200, org, "Organization details fetched successfully"),
  );
});

export const exportOrganizationUsersCsv = asyncHandler(async (req, res) => {
  const org = await prisma.organization.findUnique({
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

  if (!org) throw new ApiError(404, "Organization not found");

  const quoteCsvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [
    ["User ID", "Name", "Email", "Phone", "Role", "Status", "Joined"],
    ...org.users.map((user) => [
      user.id,
      [user.firstName, user.lastName].filter(Boolean).join(" "),
      user.email,
      "-",
      ({ ORGANIZATION_ADMIN: "ORG_ADMIN", SALES: "SALES_REP" })[user.role] || user.role,
      ({ ACTIVE: "Active", SUSPENDED: "Suspended", DEACTIVATED: "Deactivated", INVITED: "Pending" })[user.status] || user.status,
      user.createdAt.toISOString().slice(0, 10),
    ]),
  ];

  const csv = `\uFEFF${rows.map((row) => row.map(quoteCsvCell).join(",")).join("\r\n")}`;
  const filename = org.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "organization";

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}-users.csv"`);
  return res.status(200).send(csv);
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const input = req.body;
  if (!isObject(input)) throw new ApiError(400, "Organization payload must be an object");

  const oldOrg = await prisma.organization.findUnique({ where: { id } });

  if (!oldOrg) throw new ApiError(404, "Organization not found");
  if (input.name !== undefined && (typeof input.name !== "string" || !input.name.trim())) {
    throw new ApiError(400, "Organization name cannot be empty");
  }
  if (input.email !== undefined && input.email !== null && (!isText(input.email) || (input.email && !isEmail(input.email)))) {
    throw new ApiError(400, "Provide a valid organization email");
  }
  for (const field of ["phone", "website"]) {
    if (input[field] !== undefined && input[field] !== null && !isText(input[field])) {
      throw new ApiError(400, `${field} must be text`);
    }
  }
  if (input.status !== undefined && !validOrganizationStatuses.includes(input.status)) {
    throw new ApiError(400, "Invalid organization status");
  }
  if (input.planId !== undefined && input.planId !== null && !isText(input.planId)) {
    throw new ApiError(400, "Plan ID must be text");
  }
  if (input.billingCycle !== undefined && input.billingCycle !== null && !validPlanBilling.includes(input.billingCycle)) {
    throw new ApiError(400, "Invalid billing cycle");
  }
  if (input.subscriptionStatus !== undefined && !validSubscriptionStatuses.includes(input.subscriptionStatus)) {
    throw new ApiError(400, "Invalid subscription status");
  }
  if (input.paymentStatus !== undefined && !validPaymentStatuses.includes(input.paymentStatus)) {
    throw new ApiError(400, "Invalid payment status");
  }
  if (
    input.subscriptionAmount !== undefined &&
    input.subscriptionAmount !== null &&
    ((typeof input.subscriptionAmount !== "number" &&
      (typeof input.subscriptionAmount !== "string" || !input.subscriptionAmount.trim())) ||
      !Number.isFinite(Number(input.subscriptionAmount)) ||
      Number(input.subscriptionAmount) < 0)
  ) {
    throw new ApiError(400, "Subscription amount must be a non-negative number");
  }

  const org = await prisma.$transaction(async (tx) => {
    const updated = await tx.organization.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name.trim() : oldOrg.name,
        email: input.email !== undefined ? input.email?.trim() || null : oldOrg.email,
        phone: input.phone !== undefined ? input.phone?.trim() || null : oldOrg.phone,
        website: input.website !== undefined ? input.website?.trim() || null : oldOrg.website,
        status: input.status !== undefined ? input.status : oldOrg.status,
        planId: input.planId !== undefined ? input.planId : oldOrg.planId,
        subscriptionStatus: input.subscriptionStatus !== undefined ? input.subscriptionStatus : oldOrg.subscriptionStatus,
        paymentStatus: input.paymentStatus !== undefined ? input.paymentStatus : oldOrg.paymentStatus,
        billingCycle: input.billingCycle !== undefined ? input.billingCycle : oldOrg.billingCycle,
        subscriptionAmount:
          input.subscriptionAmount === undefined
            ? oldOrg.subscriptionAmount
            : input.subscriptionAmount === null
              ? null
              : Number(input.subscriptionAmount),
      },
    });

    await writeAuditLog({
      organizationId: id,
      action: "Organization updated",
      entityType: "Organization",
      entityId: id,
      oldValues: {
        name: oldOrg.name,
        status: oldOrg.status,
        email: oldOrg.email,
        planId: oldOrg.planId,
        subscriptionStatus: oldOrg.subscriptionStatus,
        paymentStatus: oldOrg.paymentStatus,
      },
      newValues: {
        name: updated.name,
        status: updated.status,
        email: updated.email,
        planId: updated.planId,
        subscriptionStatus: updated.subscriptionStatus,
        paymentStatus: updated.paymentStatus,
      },
    }, tx);

    return updated;
  });

  return res.status(200).json(
    new ApiResponse(200, org, "Organization updated successfully"),
  );
});

export const deleteOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let org;

  try {
    org = await prisma.$transaction(async (tx) => {
      const found = await tx.organization.findUnique({ where: { id } });
      if (!found) throw new ApiError(404, "Organization not found");

      // Keep old audit records after their organization is removed.
      await tx.auditLog.updateMany({
        where: { organizationId: id },
        data: { organizationId: null },
      });
      await tx.organization.delete({ where: { id } });
      await writeAuditLog({
        action: "Organization deleted",
        entityType: "Organization",
        entityId: id,
        oldValues: { name: found.name, status: found.status },
      }, tx);

      return found;
    });
  } catch (error) {
    if (error.code === "P2003") {
      throw new ApiError(409, "Organization cannot be deleted while it has related users or CRM records");
    }
    throw error;
  }

  return res.status(200).json(
    new ApiResponse(200, org, "Organization deleted successfully"),
  );
});

// Users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: { organization: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

export const createUser = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!isObject(body)) throw new ApiError(400, "User payload must be an object");

  const { firstName, lastName, email, password, role } = body;
  const { organizationId } = req.params;
  const first = isText(firstName) ? firstName.trim() : "";
  const last = isText(lastName) ? lastName.trim() : "";
  const mail = isText(email) ? email.trim() : "";

  if (!organizationId || !first || !mail || typeof password !== "string") {
    throw new ApiError(400, "Organization, first name, email, and temporary password are required");
  }
  if (!isEmail(mail)) throw new ApiError(400, "Provide a valid email address");
  if (password.length < 8) {
    throw new ApiError(400, "Temporary password must be at least 8 characters");
  }
  if (lastName !== undefined && lastName !== null && !isText(lastName)) {
    throw new ApiError(400, "Last name must be text");
  }

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new ApiError(404, "Organization not found");
  if (role !== undefined && !validUserRoles.includes(role)) throw new ApiError(400, "Invalid role specified");

  let fb;
  let saved = false;

  try {
    fb = await auth.createUser({
      email: mail,
      password,
      displayName: [first, last].filter(Boolean).join(" "),
    });

    const u = await prisma.$transaction(async (tx) => {
      if (role === "ORGANIZATION_ADMIN") {
        await tx.user.updateMany({
          where: { organizationId, role: "ORGANIZATION_ADMIN" },
          data: { role: "MANAGER" },
        });
      }

      const user = await tx.user.create({
        data: {
          firebaseUid: fb.uid,
          email: mail,
          firstName: first,
          lastName: last || null,
          role: role || "SALES",
          status: "INVITED",
          organizationId,
        },
      });

      await writeAuditLog({
        organizationId,
        action: "User created",
        entityType: "User",
        entityId: user.id,
        newValues: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      }, tx);

      return user;
    });

    saved = true;
    return res.status(201).json(new ApiResponse(201, u, "User created successfully"));
  } catch (error) {
    if (fb?.uid && !saved) {
      await auth.deleteUser(fb.uid).catch(() => {});
    }
    if (error.code === "auth/email-already-exists" || error.code === "P2002") {
      throw new ApiError(409, "A user with this email already exists");
    }
    throw error;
  }
});

// Audit logs
export const getAuditLogs = asyncHandler(async (req, res) => {
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
    detail:
      log.organization?.name ||
      log.newValues?.name ||
      log.oldValues?.name ||
      log.newValues?.email ||
      log.oldValues?.email ||
      (log.entityType === "Organization" ? "Organization" : `${log.entityType} ${log.entityId}`),
    actor: log.actor
      ? [log.actor.firstName, log.actor.lastName].filter(Boolean).join(" ")
      : "Super Admin",
    createdAt: log.createdAt,
  }));

  return res.status(200).json(
    new ApiResponse(200, result, "Audit logs fetched successfully"),
  );
});

// Plans
export const getPlans = asyncHandler(async (req, res) => {
  const planCount = await prisma.subscriptionPlan.count();

  if (planCount === 0) {
    await prisma.subscriptionPlan.createMany({
      data: defaultPlans.map((plan) => ({ ...plan, updatedAt: new Date() })),
      skipDuplicates: true,
    });
  }

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { price: "asc" },
  });

  return res.status(200).json(
    new ApiResponse(200, plans.map(mapPlan), "Subscription plans fetched successfully"),
  );
});

export const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  if (!isObject(body)) throw new ApiError(400, "Plan payload must be an object");

  const { name, price, billing, userLimit, features } = body;
  if (typeof price !== "number" && (typeof price !== "string" || !price.trim())) {
    throw new ApiError(400, "Plan price must be a number");
  }
  if (typeof userLimit !== "number" && (typeof userLimit !== "string" || !userLimit.trim())) {
    throw new ApiError(400, "User limit must be a number");
  }
  const priceNum = Number(price);
  const limitNum = Number(userLimit);

  const ok =
    typeof name === "string" &&
    name.trim().length > 0 &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    validPlanBilling.includes(billing) &&
    Number.isInteger(limitNum) &&
    limitNum >= 1 &&
    Array.isArray(features) &&
    features.every((feature) => typeof feature === "string" && feature.trim());

  if (!ok) {
    throw new ApiError(400, "Provide a valid plan name, price, billing cycle, user limit, and feature list");
  }

  const oldPlan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!oldPlan) throw new ApiError(404, "Subscription plan not found");

  const plan = await prisma.$transaction(async (tx) => {
    const updated = await tx.subscriptionPlan.update({
      where: { id },
      data: {
        name: name.trim(),
        price: priceNum,
        billing,
        userLimit: limitNum,
        features: features.map((feature) => feature.trim()),
      },
    });

    await writeAuditLog({
      action: "Subscription plan updated",
      entityType: "SubscriptionPlan",
      entityId: id,
      oldValues: { name: oldPlan.name, price: oldPlan.price },
      newValues: { name: updated.name, price: updated.price },
    }, tx);

    return updated;
  });

  return res.status(200).json(
    new ApiResponse(200, mapPlan(plan), "Subscription plan updated successfully"),
  );
});

// Platform settings
export const getPlatformSettings = asyncHandler(async (req, res) => {
  const record = await prisma.platformSettings.upsert({
    where: { id: "global" },
    create: { id: "global", settings: defaultSettings },
    update: {},
  });

  return res.status(200).json(
    new ApiResponse(200, record.settings, "Platform settings fetched successfully"),
  );
});

export const updatePlatformSettings = asyncHandler(async (req, res) => {
  const input = req.body;
  const ok =
    isObject(input) &&
    typeof input.platformName === "string" && input.platformName.trim().length > 0 &&
    typeof input.supportEmail === "string" && isEmail(input.supportEmail.trim()) &&
    typeof input.allowSignup === "boolean" &&
    typeof input.emailAlerts === "boolean" &&
    typeof input.maintenanceMode === "boolean" &&
    typeof input.newOrganizationAlerts === "boolean" &&
    typeof input.failedPaymentAlerts === "boolean" &&
    typeof input.weeklySummaryEmail === "boolean" &&
    typeof input.defaultPlanId === "string" && input.defaultPlanId.trim().length > 0;

  if (!ok) throw new ApiError(400, "Invalid platform settings payload");

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: input.defaultPlanId.trim() } });
  if (!plan) throw new ApiError(400, "Default plan was not found");

  const settings = {
    ...defaultSettings,
    ...input,
    platformName: input.platformName.trim(),
    supportEmail: input.supportEmail.trim(),
    defaultPlanId: input.defaultPlanId.trim(),
  };

  await prisma.$transaction(async (tx) => {
    await tx.platformSettings.upsert({
      where: { id: "global" },
      create: { id: "global", settings },
      update: { settings },
    });

    await writeAuditLog({
      action: "Platform settings updated",
      entityType: "PlatformSettings",
      entityId: "global",
      newValues: settings,
    }, tx);
  });

  return res.status(200).json(
    new ApiResponse(200, settings, "Platform settings updated successfully"),
  );
});

// Super Admin profile and security
export const getSuperAdminProfile = asyncHandler(async (req, res) => {
  const firebaseUser = await auth.getUser(req.superAdmin.firebaseUid);
  const profile = {
    name: req.superAdmin.name || firebaseUser.displayName || "Super Admin",
    email: req.superAdmin.email,
    phone: req.superAdmin.phone || firebaseUser.phoneNumber || "",
    role: "SUPER_ADMIN",
    designation: req.superAdmin.designation || "Platform Administrator",
    passwordLastChangedAt: req.superAdmin.passwordLastChangedAt,
  };

  return res.status(200).json(
    new ApiResponse(200, profile, "Super Admin profile fetched successfully"),
  );
});

export const updateSuperAdminProfile = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!isObject(body)) throw new ApiError(400, "Profile payload must be an object");

  const { name, email, phone, designation } = body;
  const n = typeof name === "string" ? name.trim() : "";
  const e = typeof email === "string" ? email.trim() : "";
  const phoneProvided = phone !== undefined;
  const p = typeof phone === "string" ? phone.trim().replace(/[\s()-]/g, "") : "";

  if (!n || !e) throw new ApiError(400, "Name and email are required");
  if (!isEmail(e)) throw new ApiError(400, "Provide a valid email address");
  if (phoneProvided && phone !== null && !isText(phone)) throw new ApiError(400, "Phone must be text or null");
  if (designation !== undefined && designation !== null && !isText(designation)) {
    throw new ApiError(400, "Designation must be text or null");
  }
  if (p && !/^\+[1-9]\d{7,14}$/.test(p)) {
    throw new ApiError(400, "Phone must be a valid E.164 number with at least 8 digits, for example +919876543210");
  }

  const oldFb = await auth.getUser(req.superAdmin.firebaseUid);
  const fbData = {
    displayName: n,
    email: e,
    phoneNumber: phoneProvided ? p || null : oldFb.phoneNumber || null,
  };

  try {
    await auth.updateUser(req.superAdmin.firebaseUid, fbData);
  } catch (error) {
    if (error.code === "auth/email-already-exists" || error.code === "auth/phone-number-already-exists") {
      throw new ApiError(409, "That email or phone number is already in use");
    }
    const message = `${error.code || ""} ${error.message || ""}`.toLowerCase();
    if (
      message.includes("too_short") ||
      message.includes("phone-number-too-short") ||
      message.includes("invalid-phone-number")
    ) {
      throw new ApiError(400, "Firebase rejected this phone number as too short or invalid. Enter a full international number such as +919876543210.");
    }
    throw error;
  }

  try {
    const profile = await prisma.$transaction(async (tx) => {
      const updated = await tx.superAdmin.update({
        where: { id: req.superAdmin.id },
        data: {
          name: n,
          email: e,
          phone: phoneProvided ? p || null : req.superAdmin.phone,
          designation:
            designation === undefined
              ? req.superAdmin.designation
              : typeof designation === "string"
                ? designation.trim() || null
                : null,
        },
      });

      await writeAuditLog({
        action: "Super Admin profile updated",
        entityType: "SuperAdmin",
        entityId: updated.id,
        oldValues: { email: req.superAdmin.email },
        newValues: { email: updated.email, name: updated.name },
      }, tx);

      return updated;
    });

    const result = {
      name: profile.name,
      email: profile.email,
      phone: profile.phone || "",
      role: "SUPER_ADMIN",
      designation: profile.designation || "Platform Administrator",
      passwordLastChangedAt: profile.passwordLastChangedAt,
    };

    return res.status(200).json(new ApiResponse(200, result, "Profile updated successfully"));
  } catch (error) {
    await auth.updateUser(req.superAdmin.firebaseUid, {
      displayName: oldFb.displayName || null,
      email: oldFb.email,
      phoneNumber: oldFb.phoneNumber || null,
    }).catch(() => {});
    if (error.code === "P2002") throw new ApiError(409, "That email address is already in use");
    throw error;
  }
});

export const changeSuperAdminPassword = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!isObject(body)) throw new ApiError(400, "Password payload must be an object");

  const { currentPassword, newPassword } = body;
  const apiKey = process.env.FIREBASE_WEB_API_KEY;

  if (!apiKey) {
    throw new ApiError(503, "FIREBASE_WEB_API_KEY must be configured to securely verify the current password");
  }
  if (typeof currentPassword !== "string" || !currentPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    throw new ApiError(400, "Enter the current password and a new password with at least 8 characters");
  }

  let response;
  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: req.superAdmin.email,
          password: currentPassword,
          returnSecureToken: true,
        }),
      },
    );
  } catch {
    throw new ApiError(503, "Firebase could not verify the current password. Check backend network access and try again.");
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firebaseError = result.error?.message || "";
    const setupErrors = ["API_KEY_INVALID", "API_KEY_EXPIRED", "PROJECT_NOT_FOUND", "OPERATION_NOT_ALLOWED"];

    if (setupErrors.includes(firebaseError)) {
      throw new ApiError(503, "Firebase password verification is not configured correctly. Check FIREBASE_WEB_API_KEY and Email/Password sign-in settings.");
    }
    throw new ApiError(400, "Current password is incorrect");
  }

  if (result.localId !== req.superAdmin.firebaseUid) {
    throw new ApiError(403, "Firebase identity does not match the Super Admin account");
  }

  const changedAt = new Date();
  let changed = false;
  try {
    await auth.updateUser(req.superAdmin.firebaseUid, { password: newPassword });
    changed = true;
    await auth.revokeRefreshTokens(req.superAdmin.firebaseUid);

    await prisma.$transaction(async (tx) => {
      await tx.superAdmin.update({
        where: { id: req.superAdmin.id },
        data: { passwordLastChangedAt: changedAt },
      });

      await writeAuditLog({
        action: "Super Admin password changed",
        entityType: "SuperAdmin",
        entityId: req.superAdmin.id,
      }, tx);
    });
  } catch (error) {
    if (changed) {
      await auth.updateUser(req.superAdmin.firebaseUid, { password: currentPassword }).catch(() => {});
      await auth.revokeRefreshTokens(req.superAdmin.firebaseUid).catch(() => {});
    }
    throw error;
  }

  return res.status(200).json(
    new ApiResponse(200, { passwordLastChangedAt: changedAt }, "Password changed successfully"),
  );
});

// Support tickets
export const getSupportTickets = asyncHandler(async (req, res) => {
  const tickets = await prisma.supportTicket.findMany({
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(
    new ApiResponse(200, tickets.map(mapSupportTicket), "Support tickets fetched successfully"),
  );
});

export const createSampleSupportTickets = asyncHandler(async (req, res) => {
  const count = await prisma.supportTicket.count();

  if (count === 0) {
    const orgs = await prisma.organization.findMany({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const now = Date.now();
    const tickets = sampleTickets.map((ticket, index) => ({
      ...ticket,
      organizationId: orgs[index % Math.max(orgs.length, 1)]?.id || null,
      status: "OPEN",
      replies: [],
      updatedAt: new Date(),
      createdAt: new Date(now - index * 60 * 60 * 1000),
    }));

    await prisma.supportTicket.createMany({ data: tickets, skipDuplicates: true });
  }

  const tickets = await prisma.supportTicket.findMany({
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(
    new ApiResponse(200, tickets.map(mapSupportTicket), "Sample support queries are ready"),
  );
});

export const replyToSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const message = getTicketReply(req);

  if (!message) throw new ApiError(400, "Reply message is required");

  const reply = {
    id: randomUUID(),
    by: req.superAdmin.name || req.superAdmin.email,
    message,
    createdAt: new Date().toISOString(),
  };

  const ticketOut = await prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new ApiError(404, "Support ticket not found");

    const replies = Array.isArray(ticket.replies) ? ticket.replies : [];
    const updated = await tx.supportTicket.update({
      where: { id },
      data: { status: "REPLIED", replies: [...replies, reply] },
    });

    await writeAuditLog({
      organizationId: updated.organizationId,
      action: "Support reply sent",
      entityType: "SupportTicket",
      entityId: id,
      newValues: { message },
    }, tx);

    return updated;
  });

  return res.status(201).json(
    new ApiResponse(201, mapTicket(ticketOut), "Reply saved successfully"),
  );
});

export const assignUserOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  if (!isObject(body)) throw new ApiError(400, "Assignment payload must be an object");

  const { organizationId, role } = body;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) throw new ApiError(404, "User not found");
  if (organizationId !== undefined && organizationId !== null && !isText(organizationId)) {
    throw new ApiError(400, "Organization ID must be text or null");
  }
  if (role !== undefined && !validUserRoles.includes(role)) throw new ApiError(400, "Invalid role specified");

  if (organizationId != null) {
    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) throw new ApiError(404, "Organization not found");
  }

  const orgId = organizationId !== undefined ? organizationId : user.organizationId;
  const newRole = role !== undefined ? role : user.role;
  const upUser = await prisma.$transaction(async (tx) => {
    if (newRole === "ORGANIZATION_ADMIN" && orgId) {
      await tx.user.updateMany({
        where: {
          organizationId: orgId,
          role: "ORGANIZATION_ADMIN",
          id: { not: id },
        },
        data: { role: "MANAGER" },
      });
    }

    const updated = await tx.user.update({
      where: { id },
      data: { organizationId: orgId, role: newRole },
    });

    await writeAuditLog({
      organizationId: updated.organizationId,
      action: "User assigned",
      entityType: "User",
      entityId: id,
      oldValues: { organizationId: user.organizationId, role: user.role },
      newValues: {
        organizationId: updated.organizationId,
        role: updated.role,
        email: updated.email,
      },
    }, tx);

    return updated;
  });

  return res.status(200).json(
    new ApiResponse(200, upUser, "User assigned successfully"),
  );
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  if (!isObject(body)) throw new ApiError(400, "User payload must be an object");

  const { firstName, lastName, email, role, status } = body;
  const oldU = await prisma.user.findUnique({ where: { id } });

  if (!oldU) throw new ApiError(404, "User not found");
  if (firstName !== undefined && (!isText(firstName) || !firstName.trim())) {
    throw new ApiError(400, "First name cannot be empty");
  }
  if (lastName !== undefined && lastName !== null && !isText(lastName)) {
    throw new ApiError(400, "Last name must be text");
  }
  if (email !== undefined && (!isText(email) || !isEmail(email.trim()))) {
    throw new ApiError(400, "Provide a valid email address");
  }
  if (role !== undefined && !validUserRoles.includes(role)) throw new ApiError(400, "Invalid role specified");
  if (status !== undefined && !validUserStatuses.includes(status)) throw new ApiError(400, "Invalid status specified");

  const up = {
    firstName: firstName !== undefined ? firstName.trim() : oldU.firstName,
    lastName: lastName === null ? null : lastName !== undefined ? lastName.trim() || null : oldU.lastName,
    email: email !== undefined ? email.trim() : oldU.email,
    role: role !== undefined ? role : oldU.role,
    status: status !== undefined ? status : oldU.status,
  };

  const fb = {
    email: up.email,
    displayName: [up.firstName, up.lastName].filter(Boolean).join(" "),
  };
  const oldFbData = {
    email: oldU.email,
    displayName: [oldU.firstName, oldU.lastName].filter(Boolean).join(" "),
  };
  const fbChanged =
    fb.email !== oldFbData.email ||
    fb.displayName !== oldFbData.displayName;

  if (fbChanged) await auth.updateUser(oldU.firebaseUid, fb);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      if (up.role === "ORGANIZATION_ADMIN" && oldU.organizationId) {
        await tx.user.updateMany({
          where: {
            organizationId: oldU.organizationId,
            role: "ORGANIZATION_ADMIN",
            id: { not: id },
          },
          data: { role: "MANAGER" },
        });

      }

      const updated = await tx.user.update({ where: { id }, data: up });
      await writeAuditLog({
        organizationId: updated.organizationId,
        action: "User updated",
        entityType: "User",
        entityId: id,
        oldValues: {
          firstName: oldU.firstName,
          lastName: oldU.lastName,
          email: oldU.email,
          role: oldU.role,
          status: oldU.status,
        },
        newValues: {
          firstName: updated.firstName,
          lastName: updated.lastName,
          email: updated.email,
          role: updated.role,
          status: updated.status,
        },
      }, tx);

      return updated;
    });
  } catch (error) {
    if (fbChanged) {
      await auth.updateUser(oldU.firebaseUid, oldFbData).catch(() => {});
    }
    if (error.code === "P2002" || error.code === "auth/email-already-exists") {
      throw new ApiError(409, "A user with this email already exists");
    }
    throw error;
  }

  return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) throw new ApiError(404, "User not found");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id } });
      await writeAuditLog({
        organizationId: user.organizationId,
        action: "User deleted",
        entityType: "User",
        entityId: id,
        oldValues: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      }, tx);
    });
  } catch (error) {
    if (error.code === "P2003") {
      throw new ApiError(409, "User cannot be deleted while assigned to CRM records");
    }
    throw error;
  }

  await auth.deleteUser(user.firebaseUid).catch((error) => {
    if (error.code !== "auth/user-not-found") {
      console.error("Failed to remove Firebase identity for deleted CRM user:", error.code);
    }
  });

  return res.status(200).json(new ApiResponse(200, user, "User deleted successfully"));
});
