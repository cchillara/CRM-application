import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { superAdminRequest } from "../api/superAdminApi";

const PlatformContext = createContext(null);
const STORAGE_KEY = "shnoor-platform-data-v3";

const defaultPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 1499,
    billing: "Monthly",
    userLimit: 15,
    features: ["Leads and customers", "Deals and tasks", "Basic reports", "Email support"]
  },
  {
    id: "growth",
    name: "Growth",
    price: 3999,
    billing: "Monthly",
    userLimit: 50,
    features: ["Everything in Starter", "Team management", "Advanced reports", "CSV export", "Priority support"]
  },
  {
    id: "pro",
    name: "Pro",
    price: 8999,
    billing: "Monthly",
    userLimit: 200,
    features: ["Everything in Growth", "Advanced permissions", "Custom workflows", "API access", "Priority support"]
  }
];

const defaultOrganizations = [
  {
    id: "ORG-1001",
    name: "ABC Technologies",
    status: "Active",
    planId: "growth",
    subscriptionStatus: "Active",
    paymentStatus: "Paid",
    joined: "2026-09-02",
    admin: { name: "Aarav Mehta", email: "aarav@abctech.in", phone: "+91 98765 12001" },
    users: [
      { id: "USR-1001", name: "Aarav Mehta", email: "aarav@abctech.in", phone: "+91 98765 12001", role: "ORG_ADMIN", status: "Active", joined: "2026-09-02" },
      { id: "USR-1002", name: "Riya Kapoor", email: "riya@abctech.in", phone: "+91 98765 12002", role: "MANAGER", status: "Active", joined: "2026-09-05" },
      { id: "USR-1003", name: "Karthik S", email: "karthik@abctech.in", phone: "+91 98765 12003", role: "SALES_REP", status: "Active", joined: "2026-09-07" }
    ]
  },
  {
    id: "ORG-1002",
    name: "NovaStack Labs",
    status: "Active",
    planId: "pro",
    subscriptionStatus: "Active",
    paymentStatus: "Paid",
    joined: "2026-09-08",
    admin: { name: "Meera Iyer", email: "meera@novastack.io", phone: "+91 98765 22001" },
    users: [
      { id: "USR-2001", name: "Meera Iyer", email: "meera@novastack.io", phone: "+91 98765 22001", role: "ORG_ADMIN", status: "Active", joined: "2026-09-08" },
      { id: "USR-2002", name: "Harish Kumar", email: "harish@novastack.io", phone: "+91 98765 22002", role: "MANAGER", status: "Active", joined: "2026-09-10" },
      { id: "USR-2003", name: "Divya R", email: "divya@novastack.io", phone: "+91 98765 22003", role: "SALES_REP", status: "Active", joined: "2026-09-12" },
      { id: "USR-2004", name: "Naveen P", email: "naveen@novastack.io", phone: "+91 98765 22004", role: "SALES_REP", status: "Active", joined: "2026-09-13" }
    ]
  },
  {
    id: "ORG-1003",
    name: "BlueOrbit Systems",
    status: "Pending",
    planId: "starter",
    subscriptionStatus: "Pending",
    paymentStatus: "Payment Pending",
    joined: "2026-09-16",
    admin: { name: "Rahul Nair", email: "rahul@blueorbit.in", phone: "+91 98765 32001" },
    users: [
      { id: "USR-3001", name: "Rahul Nair", email: "rahul@blueorbit.in", phone: "+91 98765 32001", role: "ORG_ADMIN", status: "Active", joined: "2026-09-16" }
    ]
  },
  {
    id: "ORG-1004",
    name: "Vertex Commerce",
    status: "Active",
    planId: "growth",
    subscriptionStatus: "Active",
    paymentStatus: "Paid",
    joined: "2026-09-18",
    admin: { name: "Sana Khan", email: "sana@vertexcommerce.com", phone: "+91 98765 42001" },
    users: [
      { id: "USR-4001", name: "Sana Khan", email: "sana@vertexcommerce.com", phone: "+91 98765 42001", role: "ORG_ADMIN", status: "Active", joined: "2026-09-18" },
      { id: "USR-4002", name: "Pranav S", email: "pranav@vertexcommerce.com", phone: "+91 98765 42002", role: "MANAGER", status: "Active", joined: "2026-09-19" },
      { id: "USR-4003", name: "Asha M", email: "asha@vertexcommerce.com", phone: "+91 98765 42003", role: "SALES_REP", status: "Active", joined: "2026-09-20" }
    ]
  },
  {
    id: "ORG-1005",
    name: "PixelForge Studio",
    status: "Suspended",
    planId: "starter",
    subscriptionStatus: "Inactive",
    paymentStatus: "Unpaid",
    joined: "2026-09-20",
    admin: { name: "Vikram Shah", email: "vikram@pixelforge.co", phone: "+91 98765 52001" },
    users: [
      { id: "USR-5001", name: "Vikram Shah", email: "vikram@pixelforge.co", phone: "+91 98765 52001", role: "ORG_ADMIN", status: "Suspended", joined: "2026-09-20" },
      { id: "USR-5002", name: "Neha V", email: "neha@pixelforge.co", phone: "+91 98765 52002", role: "SALES_REP", status: "Suspended", joined: "2026-09-21" }
    ]
  }
];

const defaultTickets = [
  {
    id: "TICK-8091", orgId: "ORG-1001", subject: "SSO token refresh issue", category: "Login",
    priority: "High", status: "Open", createdAt: "2026-10-05 10:30",
    message: "Users are being asked to sign in again during the day. Please check token refresh behavior.", replies: []
  },
  {
    id: "TICK-7984", orgId: "ORG-1002", subject: "CSV export request", category: "Reports",
    priority: "Medium", status: "Replied", createdAt: "2026-10-04 16:20",
    message: "We need a clean CSV export for our quarterly reporting.",
    replies: [{ id: "REP-1", by: "Super Admin", message: "CSV export is available from the organization users page. Please try it and confirm.", createdAt: "2026-10-04 17:10" }]
  },
  {
    id: "TICK-8022", orgId: "ORG-1004", subject: "Multi-currency invoice request", category: "Billing",
    priority: "Medium", status: "Open", createdAt: "2026-10-05 09:05",
    message: "Can billing support USD along with INR for our international customers?", replies: []
  },
  {
    id: "TICK-7916", orgId: "ORG-1003", subject: "Unable to invite a new teammate", category: "Users", priority: "High", status: "Open", createdAt: "2026-10-03 14:42",
    message: "The invite screen says the email is already registered, but this teammate cannot sign in. Can you check their account status?", replies: []
  },
  {
    id: "TICK-7860", orgId: "ORG-1005", subject: "Monthly report totals look incorrect", category: "Reports", priority: "Low", status: "Open", createdAt: "2026-10-02 11:18",
    message: "The September report total does not match the deals list. Please help us understand which date range the report uses.", replies: []
  }
];

const defaultData = {
  plans: defaultPlans,
  organizations: defaultOrganizations,
  tickets: defaultTickets,
  settings: {
    platformName: "SHNOOR CRM", supportEmail: "support@shnoor.com", allowSignup: true,
    emailAlerts: true, maintenanceMode: false, defaultPlanId: "starter",
    newOrganizationAlerts: true, failedPaymentAlerts: true, weeklySummaryEmail: false
  },
  profile: {
    name: "Super Admin", email: "admin@shnoor.com", phone: "+91 90000 00000",
    role: "SUPER_ADMIN", designation: "Platform Administrator"
  },
  security: {
    passwordLastChangedAt: null
  },
  auditLogs: [
    { id: "AUD-1001", action: "Organization suspended", detail: "PixelForge Studio", actor: "Super Admin", createdAt: "2026-10-05 11:20" },
    { id: "AUD-1002", action: "Support reply sent", detail: "TICK-7984", actor: "Super Admin", createdAt: "2026-10-04 17:10" },
    { id: "AUD-1003", action: "Organization created", detail: "BlueOrbit Systems", actor: "System", createdAt: "2026-09-16 10:00" }
  ]
};

function migrateData(parsed) {
  const plans = (Array.isArray(parsed?.plans) ? parsed.plans : defaultPlans).filter((plan) => plan && typeof plan === "object");
  const organizations = (Array.isArray(parsed?.organizations) ? parsed.organizations : defaultOrganizations).filter((org) => org && typeof org === "object");
  return {
    ...defaultData,
    ...parsed,
    plans: plans.map((plan) => ({
      ...plan,
      billing: plan.billing || "Monthly",
      features: Array.isArray(plan.features) ? plan.features : []
    })),
    organizations: organizations.map((org) => ({
      ...org,
      paymentStatus: org.paymentStatus || (org.subscriptionStatus === "Active" ? "Paid" : org.subscriptionStatus === "Pending" ? "Payment Pending" : "Unpaid"),
      users: Array.isArray(org.users) ? org.users : []
    })),
    tickets: (Array.isArray(parsed?.tickets) && parsed.tickets.length ? parsed.tickets : defaultTickets)
      .filter((ticket) => ticket && typeof ticket === "object")
      .map((ticket) => ({ ...ticket, replies: Array.isArray(ticket.replies) ? ticket.replies : [] })),
    settings: { ...defaultData.settings, ...(parsed?.settings || {}) },
    profile: { ...defaultData.profile, ...(parsed?.profile || {}) },
    security: { ...defaultData.security, ...(parsed?.security || {}) },
    auditLogs: []
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? migrateData(JSON.parse(saved)) : defaultData;
  } catch {
    return defaultData;
  }
}

const roleFromApi = (role) => ({ ORGANIZATION_ADMIN: "ORG_ADMIN", SALES: "SALES_REP" }[role] || role);
const roleToApi = (role) => ({ ORG_ADMIN: "ORGANIZATION_ADMIN", SALES_REP: "SALES" }[role] || role);
const statusFromApi = (status) => ({ ACTIVE: "Active", SUSPENDED: "Suspended", DEACTIVATED: "Deactivated", INVITED: "Pending" }[status] || status);
const statusToApi = (status) => ({ Active: "ACTIVE", Suspended: "SUSPENDED", Deactivated: "DEACTIVATED", Pending: "INVITED" }[status] || status);
const organizationStatusToApi = (status) => ({ Active: "ACTIVE", Suspended: "SUSPENDED", Deactivated: "DEACTIVATED" }[status] || status);
const subscriptionStatusFromApi = (status) => ({ ACTIVE: "Active", PENDING: "Pending", INACTIVE: "Inactive" }[status] || status || "Not configured");
const paymentStatusFromApi = (status) => ({ PAID: "Paid", PENDING: "Payment Pending", UNPAID: "Unpaid", FAILED: "Failed" }[status] || status || "Not configured");
const subscriptionStatusToApi = (status) => ({ Active: "ACTIVE", Pending: "PENDING", Inactive: "INACTIVE" }[status] || status);
const paymentStatusToApi = (status) => ({ Paid: "PAID", "Payment Pending": "PENDING", Unpaid: "UNPAID", Failed: "FAILED" }[status] || status);

function mapOrganization(org) {
  const users = (Array.isArray(org.users) ? org.users : []).filter((user) => user && typeof user === "object").map(mapUser);
  return {
    id: String(org.id || ""),
    name: String(org.name || "Unnamed organization"),
    status: statusFromApi(org.status),
    planId: org.planId || "",
    subscriptionStatus: subscriptionStatusFromApi(org.subscriptionStatus),
    paymentStatus: paymentStatusFromApi(org.paymentStatus),
    billingCycle: org.billingCycle || "",
    subscriptionAmount: org.subscriptionAmount == null ? null : Number(org.subscriptionAmount),
    joined: toDateLabel(org.createdAt),
    admin: { ...(users.find((user) => user.role === "ORG_ADMIN") || { name: "", email: org.email || "", isContactOnly: true }), phone: org.phone || "" },
    users
  };
}

function mapUser(user) {
  return {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
    email: user.email,
    phone: user.phone || "-",
    role: roleFromApi(user.role),
    status: statusFromApi(user.status),
    joined: toDateLabel(user.createdAt)
  };
}

function mapPlan(plan) {
  return { ...plan, price: Number(plan.price) || 0, features: Array.isArray(plan.features) ? plan.features : [] };
}

function toDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toISOString().slice(0, 10);
}

export function PlatformProvider({ children }) {
  // Organizations/users come from the backend. Unsupported local-only screens
  // must not imply that demo tickets or audit rows were read from PostgreSQL.
  const [data, setData] = useState(() => ({ ...loadData(), organizations: [], tickets: [], unassignedUsers: [], auditLogs: [] }));
  const [apiError, setApiError] = useState("");
  const [apiLoading, setApiLoading] = useState(true);

  const refreshData = async () => {
    setApiLoading(true);
    const [organizationResult, userResult, auditResult, planResult, settingsResult, profileResult, ticketResult] = await Promise.allSettled([
      superAdminRequest("/organizations"),
      superAdminRequest("/users"),
      superAdminRequest("/audit-logs"),
      superAdminRequest("/plans"),
      superAdminRequest("/settings"),
      superAdminRequest("/profile"),
      superAdminRequest("/support/tickets")
    ]);

    const startupErrors = [];
    let tickets = ticketResult.status === "fulfilled" && Array.isArray(ticketResult.value) ? ticketResult.value : null;
    if (tickets && tickets.length === 0) {
      try { tickets = await superAdminRequest("/support/sample-tickets", { method: "POST" }); }
      catch (error) { startupErrors.push(error.message || "Could not initialize sample support queries"); }
    }
    const errors = [organizationResult, userResult, auditResult, planResult, settingsResult, profileResult, ticketResult]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.message || "Request failed");
    errors.push(...startupErrors);
    if (organizationResult.status === "rejected") {
      setApiError(errors.join(" · "));
      setApiLoading(false);
      return;
    }

    const organizations = Array.isArray(organizationResult.value) ? organizationResult.value : null;
    const users = userResult.status === "fulfilled" && Array.isArray(userResult.value) ? userResult.value : null;
    if (!organizations || (userResult.status === "fulfilled" && !users)) {
      setApiError("The CRM API returned an unexpected response. Check the backend API version and response format.");
      setApiLoading(false);
      return;
    }
    const usersByOrganization = new Map();
    (users || []).forEach((user) => {
      if (!user.organizationId) return;
      usersByOrganization.set(user.organizationId, [...(usersByOrganization.get(user.organizationId) || []), user]);
    });
    const mapped = organizations.map((org) => mapOrganization({
      ...org,
      users: users ? (usersByOrganization.get(org.id) || []) : (Array.isArray(org.users) ? org.users : [])
    }));
    const auditLogs = auditResult.status === "fulfilled" && Array.isArray(auditResult.value) ? auditResult.value : [];
    const plans = planResult.status === "fulfilled" && Array.isArray(planResult.value) ? planResult.value.map(mapPlan) : null;
    const settings = settingsResult.status === "fulfilled" && settingsResult.value && typeof settingsResult.value === "object" ? settingsResult.value : null;
    const profile = profileResult.status === "fulfilled" && profileResult.value && typeof profileResult.value === "object" ? profileResult.value : null;
    setData((current) => {
      const next = {
        ...current,
        organizations: mapped,
        unassignedUsers: (users || []).filter((user) => !user.organizationId).map(mapUser),
        auditLogs,
        plans: plans || current.plans,
        settings: settings ? { ...defaultData.settings, ...settings } : current.settings,
        profile: profile || current.profile,
        security: profile ? { ...current.security, passwordLastChangedAt: profile.passwordLastChangedAt || null } : current.security,
        tickets: Array.isArray(tickets) ? tickets : current.tickets,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setApiError(errors.join(" · "));
    setApiLoading(false);
  };

  const refreshOrganizations = async () => {
    const results = await Promise.allSettled([
      superAdminRequest("/organizations"),
      superAdminRequest("/users"),
      superAdminRequest("/audit-logs")
    ]);
    const [organizationResult, userResult, auditResult] = results;
    if (organizationResult.status === "rejected" || userResult.status === "rejected") {
      setApiError([organizationResult, userResult]
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason?.message || "Could not refresh organizations")
        .join(" · "));
      return;
    }
    const organizations = organizationResult.value;
    const users = userResult.value;
    const auditLogs = auditResult.status === "fulfilled" ? auditResult.value : null;
    const usersByOrganization = new Map();
    users.forEach((user) => {
      if (!user.organizationId) return;
      usersByOrganization.set(user.organizationId, [...(usersByOrganization.get(user.organizationId) || []), user]);
    });
    commit((current) => ({
      ...current,
      organizations: organizations.map((org) => mapOrganization({ ...org, users: usersByOrganization.get(org.id) || [] })),
      unassignedUsers: users.filter((user) => !user.organizationId).map(mapUser),
      auditLogs: auditLogs || current.auditLogs
    }));
    setApiError("");
  };

  useEffect(() => {
    let active = true;
    refreshData().catch((error) => {
      if (active) setApiError(error.message || "Could not load Super Admin data");
    }).finally(() => { if (active) setApiLoading(false); });
    return () => { active = false; };
  }, []);

  const commit = (updater) => {
    setData((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const addOrganization = async (form) => {
    let organization;
    try {
      if (!form.adminName?.trim() || !form.adminEmail?.trim() || !form.adminPassword) {
        throw new Error("Enter the organization admin name, login email, and temporary password.");
      }
      organization = await superAdminRequest("/organizations", {
        method: "POST",
        body: JSON.stringify({ name: form.name.trim(), email: form.adminEmail.trim() || null, phone: form.adminPhone.trim() || null })
      });
      {
        const [firstName, ...lastName] = form.adminName.trim().split(/\s+/);
        try {
          await superAdminRequest(`/organizations/${organization.id}/users`, {
            method: "POST",
            body: JSON.stringify({ firstName, lastName: lastName.join(" "), email: form.adminEmail.trim(), password: form.adminPassword, role: "ORGANIZATION_ADMIN" })
          });
        } catch (error) {
          await refreshOrganizations().catch(() => {});
          error.createdOrganizationId = organization.id;
          throw error;
        }
      }
      await refreshOrganizations();
      setApiError("");
      return organization.id;
    } catch (error) { setApiError(error.message); throw error; }
  };

  const assignUser = async (userId, organizationId, role = "ORGANIZATION_ADMIN") => {
    try {
      await superAdminRequest(`/users/${userId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ organizationId, role: roleToApi(role) })
      });
      await refreshOrganizations();
      setApiError("");
    } catch (error) { setApiError(error.message); throw error; }
  };

  const addUser = async (orgId, form) => {
    const [firstName, ...lastName] = form.name.trim().split(/\s+/);
    try {
      await superAdminRequest(`/organizations/${orgId}/users`, {
        method: "POST",
        body: JSON.stringify({ firstName, lastName: lastName.join(" "), email: form.email.trim(), password: form.password, role: roleToApi(form.role) })
      });
      await refreshOrganizations();
      setApiError("");
    } catch (error) { setApiError(error.message); throw error; }
  };

  const updateOrganization = async (orgId, form) => {
    const selectedPlan = data.plans.find((plan) => plan.id === form.planId);
    try {
      await superAdminRequest(`/organizations/${orgId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          status: organizationStatusToApi(form.status),
          email: form.adminEmail?.trim() || null,
          phone: form.adminPhone?.trim() || null,
          planId: form.planId || null,
          ...(form.subscriptionStatus && form.subscriptionStatus !== "Not configured" ? { subscriptionStatus: subscriptionStatusToApi(form.subscriptionStatus) } : {}),
          ...(form.paymentStatus && form.paymentStatus !== "Not configured" ? { paymentStatus: paymentStatusToApi(form.paymentStatus) } : {}),
          billingCycle: selectedPlan?.billing || form.billingCycle || null,
          subscriptionAmount: selectedPlan?.price ?? form.subscriptionAmount ?? null
        })
      });
      const currentOrg = data.organizations.find((org) => org.id === orgId);
      const admin = currentOrg?.users?.find((user) => user.role === "ORG_ADMIN");
      if (admin?.id && admin.id === form.adminUserId && form.adminName?.trim() && form.adminEmail?.trim()) {
        const [firstName, ...lastName] = form.adminName.trim().split(/\s+/);
        await superAdminRequest(`/users/${admin.id}`, {
          method: "PATCH",
          body: JSON.stringify({ firstName, lastName: lastName.join(" "), email: form.adminEmail.trim() })
        });
      }
      await refreshOrganizations();
      setApiError("");
    } catch (error) { setApiError(error.message); throw error; }
  };

  const deleteOrganization = async (orgId) => {
    try {
      await superAdminRequest(`/organizations/${orgId}`, { method: "DELETE" });
      await refreshOrganizations();
      setApiError("");
    } catch (error) { setApiError(error.message); throw error; }
  };

  const updateUser = async (orgId, userId, form) => {
    const [firstName, ...lastName] = form.name.trim().split(/\s+/);
    try {
      await superAdminRequest(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ firstName, lastName: lastName.join(" "), email: form.email.trim(), role: roleToApi(form.role), status: statusToApi(form.status) })
      });
      await refreshOrganizations();
      setApiError("");
      return;
    } catch (error) { setApiError(error.message); throw error; }

  };

  const deleteUser = async (orgId, userId) => {
    try {
      await superAdminRequest(`/users/${userId}`, { method: "DELETE" });
      await refreshOrganizations();
      setApiError("");
      return;
    } catch (error) { setApiError(error.message); throw error; }

  };

  const updatePlan = async (planId, form) => {
    const features = Array.isArray(form.features) ? form.features.filter(Boolean) : String(form.features || "").split("\n").map((item) => item.trim()).filter(Boolean);
    try {
      const savedPlan = await superAdminRequest(`/plans/${planId}`, { method: "PUT", body: JSON.stringify({ name: form.name.trim(), price: Math.max(0, Number(form.price) || 0), billing: form.billing, userLimit: Math.max(1, Number(form.userLimit) || 1), features }) });
      const auditResult = await Promise.allSettled([superAdminRequest("/audit-logs")]);
      const auditLogs = auditResult[0].status === "fulfilled" ? auditResult[0].value : null;
      commit((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === planId ? mapPlan(savedPlan) : plan), auditLogs: auditLogs || current.auditLogs }));
      setApiError("");
    } catch (error) { setApiError(error.message); throw error; }
  };

  const replyTicket = async (ticketId, message) => {
    try {
      await superAdminRequest(`/support/tickets/${ticketId}/replies`, { method: "POST", body: JSON.stringify({ message: message.trim() }) });
      const [ticketResult, auditResult] = await Promise.allSettled([superAdminRequest("/support/tickets"), superAdminRequest("/audit-logs")]);
      commit((current) => ({
        ...current,
        tickets: ticketResult.status === "fulfilled" ? ticketResult.value : current.tickets,
        auditLogs: auditResult.status === "fulfilled" ? auditResult.value : current.auditLogs
      }));
      setApiError("");
    } catch (error) { setApiError(error.message); throw error; }
  };

  const restoreSampleTickets = async () => {
    try {
      const tickets = await superAdminRequest("/support/sample-tickets", { method: "POST" });
      commit((current) => ({ ...current, tickets }));
      setApiError("");
    } catch (error) { setApiError(error.message); throw error; }
  };

  const updateSettings = async (settings) => {
    try {
      const savedSettings = await superAdminRequest("/settings", { method: "PUT", body: JSON.stringify(settings) });
      const auditResult = await Promise.allSettled([superAdminRequest("/audit-logs")]);
      const auditLogs = auditResult[0].status === "fulfilled" ? auditResult[0].value : null;
      commit((current) => ({ ...current, settings: savedSettings, auditLogs: auditLogs || current.auditLogs }));
      setApiError("");
    } catch (error) { setApiError(error.message); throw error; }
  };

  const updateProfile = async (profile) => {
    try {
      const savedProfile = await superAdminRequest("/profile", { method: "PATCH", body: JSON.stringify(profile) });
      const auditResult = await Promise.allSettled([superAdminRequest("/audit-logs")]);
      const auditLogs = auditResult[0].status === "fulfilled" ? auditResult[0].value : null;
      commit((current) => ({ ...current, profile: savedProfile, auditLogs: auditLogs || current.auditLogs }));
      setApiError("");
    } catch (error) { setApiError(error.message); throw error; }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const result = await superAdminRequest("/security/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      const auditResult = await Promise.allSettled([superAdminRequest("/audit-logs")]);
      const auditLogs = auditResult[0].status === "fulfilled" ? auditResult[0].value : null;
      commit((current) => ({ ...current, security: { ...current.security, passwordLastChangedAt: result.passwordLastChangedAt }, auditLogs: auditLogs || current.auditLogs }));
      setApiError("");
      return result;
    } catch (error) { setApiError(error.message); throw error; }
  };

  const metrics = useMemo(() => {
    const totalOrganizations = data.organizations.length;
    const activeOrganizations = data.organizations.filter((org) => org.status === "Active").length;
    const totalUsers = data.organizations.reduce((sum, org) => sum + (org.users?.length || 0), 0);
    const activeUsers = data.organizations.reduce(
      (sum, org) => sum + (org.users || []).filter((user) => user.status === "Active").length,
      0
    );
    const activeSubscriptions = data.organizations.filter((org) => org.subscriptionStatus === "Active").length;
    const paymentPending = data.organizations.filter((org) => org.paymentStatus === "Payment Pending").length;
    const openTickets = data.tickets.filter((ticket) => ticket.status === "Open").length;
    const monthlyRevenue = data.organizations.reduce((sum, org) => {
      if (org.subscriptionStatus !== "Active" || org.paymentStatus !== "Paid") return sum;
      const billingMonths = { Monthly: 1, Quarterly: 3, Yearly: 12 }[org.billingCycle] || 1;
      return sum + ((Number(org.subscriptionAmount) || 0) / billingMonths);
    }, 0);
    return {
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      activeUsers,
      activeSubscriptions,
      paymentPending,
      openTickets,
      monthlyRevenue
    };
  }, [data]);

  const value = useMemo(() => ({
    data,
    apiError,
    apiLoading,
    refreshData,
    metrics,
    addOrganization,
    addUser,
    assignUser,
    updateOrganization,
    deleteOrganization,
    updateUser,
    deleteUser,
    updatePlan,
    replyTicket,
    restoreSampleTickets,
    updateSettings,
    updateProfile,
    changePassword
  }), [data, metrics, apiError, apiLoading, refreshData]);

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const value = useContext(PlatformContext);
  if (!value) throw new Error("usePlatform must be used inside PlatformProvider");
  return value;
}
