import crypto from "crypto";
import prisma from "../db/index.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { auth } from "../firebase-admin.js";

const mapLeadSource = (src) => {
    const s = String(src || '').toUpperCase().trim();
    if (s.includes('WEB')) return 'WEBSITE';
    if (s.includes('REF')) return 'REFERRAL';
    if (s.includes('LINKEDIN') || s.includes('SOCIAL')) return 'SOCIAL_MEDIA';
    if (s.includes('EMAIL')) return 'EMAIL';
    if (s.includes('PHONE') || s.includes('CALL')) return 'PHONE';
    if (s.includes('AD')) return 'ADVERTISEMENT';
    return 'OTHER';
};

const mapLeadStatus = (st) => {
    const s = String(st || '').toUpperCase().trim();
    if (['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'].includes(s)) return s;
    if (s === 'ACTIVE') return 'NEW';
    if (s === 'PENDING') return 'CONTACTED';
    return 'NEW';
};

const getClientAdmin = async (firebaseUid, email) => {
    let user = await prisma.user.findUnique({
        where: {
            firebaseUid,
        },
        select: {
            id: true,
            role: true,
            organizationId: true,
        },
    });

    if (!user && email) {
        user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, role: true, organizationId: true },
        });
        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: { firebaseUid },
            });
        }
    }

    if (!user) {
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({
                data: {
                    name: "SHNOOR CRM Organization",
                    email: email || "admin@crmclient.com",
                    status: "ACTIVE",
                },
            });
        }

        user = await prisma.user.create({
            data: {
                firebaseUid,
                email: email || `user_${firebaseUid.slice(0, 8)}@crmclient.com`,
                firstName: "Client",
                lastName: "Admin",
                role: "ORGANIZATION_ADMIN",
                status: "ACTIVE",
                organizationId: org.id,
            },
            select: {
                id: true,
                role: true,
                organizationId: true,
            },
        });
    }

    if (!user.organizationId) {
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({
                data: {
                    name: "SHNOOR CRM Organization",
                    email: "admin@crmclient.com",
                    status: "ACTIVE",
                },
            });
        }
        user = await prisma.user.update({
            where: { id: user.id },
            data: { organizationId: org.id },
            select: {
                id: true,
                role: true,
                organizationId: true,
            },
        });
    }

    return {
        user,
    };
};

/* ──────────────────────────────────────────────────────────────
 * Shared role/status validators (reused by Employees and Users)
 * These were previously called but never defined, causing ReferenceError.
 * ──────────────────────────────────────────────────────────────*/
const VALID_USER_ROLES = new Set(["ORGANIZATION_ADMIN", "MANAGER", "SALES"]);
const VALID_USER_STATUSES = new Set(["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"]);

const validateUserRole = (role) => VALID_USER_ROLES.has(role);
const validateUserStatus = (status) => VALID_USER_STATUSES.has(status);

/* ──────────────────────────────────────────────────────────────
 * LEAD_INCLUDE – shared Prisma include shape for lead relations.
 * ──────────────────────────────────────────────────────────────*/
const LEAD_INCLUDE = {
    company: true,
    contact: true,
    assignedTo: {
        select: { id: true, firstName: true, lastName: true },
    },
};

/* ──────────────────────────────────────────────────────────────
 * formatLead
 *
 * Maps a Prisma Lead record (with LEAD_INCLUDE relations) to a
 * frontend-compatible shape.  The existing field names are kept
 * for backward compatibility; JSON-in-description parsing is
 * removed in favour of real DB relations.
 * ──────────────────────────────────────────────────────────────*/
const formatLead = (l) => {
    const contactName = l.contact
        ? `${l.contact.firstName || ''} ${l.contact.lastName || ''}`.trim() || null
        : null;
    const assignedName = l.assignedTo
        ? `${l.assignedTo.firstName || ''} ${l.assignedTo.lastName || ''}`.trim()
        : 'Unassigned';

    const nameStr = l.title || 'Untitled Lead';
    const initials = nameStr
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'LE';

    const stEnum = l.status || 'NEW';
    const formattedStatus =
        stEnum === 'NEW' ? 'Active'
        : stEnum.charAt(0) + stEnum.slice(1).toLowerCase().replace(/_/g, ' ');
    const stType =
        stEnum === 'NEW' ? 'active'
        : stEnum === 'QUALIFIED' ? 'qualified'
        : 'pending';

    const formattedSource = l.source
        ? l.source.charAt(0) + l.source.slice(1).toLowerCase().replace(/_/g, ' ')
        : 'Other';

    return {
        id: l.id,
        name: l.title,
        title: l.title,
        description: l.description,
        contact: contactName,
        email: l.contact?.email ?? null,
        phone: l.contact?.phone ?? null,
        avatarInitials: initials,
        // value/numericValue/tier kept for frontend backward-compatibility.
        // The Lead schema has no numeric value column; these are safe defaults.
        value: '$0',
        numericValue: 0,
        tier: 'Growth',
        status: formattedStatus,
        statusType: stType,
        source: formattedSource,
        assignedTo: assignedName,
        assignedToId: l.assignedToId,
        companyId: l.companyId,
        contactId: l.contactId,
        convertedAt: l.convertedAt,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
    };
};

/* ──────────────────────────────────────────────────────────────
 * DEAL_INCLUDE – shared Prisma include shape for deal relations.
 * ──────────────────────────────────────────────────────────────*/
const DEAL_INCLUDE = {
    customer: { include: { company: true } },
    assignedTo: {
        select: { id: true, firstName: true, lastName: true },
    },
};

const mapDealStage = (st) => {
    const s = String(st || '').toUpperCase().trim();
    if (['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].includes(s)) return s;
    if (s === 'QUALIFIED') return 'QUALIFICATION';
    return 'PROPOSAL';
};

const formatDeal = (d) => {
    let extraMeta = {};
    if (d.description) {
        try {
            if (d.description.startsWith('{')) extraMeta = JSON.parse(d.description);
        } catch (e) {}
    }

    const companyName = d.customer?.company?.name || extraMeta.company || 'Enterprise Client';
    const contactName = extraMeta.contact || 'Primary Contact';
    const ownerName = d.assignedTo ? `${d.assignedTo.firstName || ''} ${d.assignedTo.lastName || ''}`.trim() : (extraMeta.owner || 'Ravi Kiran');
    const stageName = d.stage === 'QUALIFICATION' ? 'Qualified' : (d.stage ? (d.stage.charAt(0) + d.stage.slice(1).toLowerCase()) : 'Proposal');

    return {
        id: d.id,
        title: d.title,
        company: companyName,
        contact: contactName,
        value: Number(d.value) || 0,
        stage: stageName,
        probability: extraMeta.probability ?? (d.stage === 'WON' ? 100 : d.stage === 'LOST' ? 0 : 60),
        owner: ownerName,
        expectedCloseDate: extraMeta.expectedCloseDate || (d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '2026-10-30'),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
    };
};

export const getDashboard = async (req, res) => {
    try {
        const orgId = req.organizationId || req.user?.organizationId;
        const whereClause = orgId ? { organizationId: orgId } : {};

        const [
            allLeads,
            allDeals
        ] = await Promise.all([
            prisma.lead.findMany({
                where: whereClause,
                include: { company: true, contact: true, assignedTo: true },
                orderBy: { createdAt: "desc" }
            }),
            prisma.deal.findMany({
                where: whereClause,
                include: { customer: { include: { company: true } }, assignedTo: true },
                orderBy: { createdAt: "desc" }
            })
        ]);

        const totalLeads = allLeads.length;
        const qualifiedLeadsCount = allLeads.filter(l => l.status === "QUALIFIED").length;
        const activeLeadsCount = allLeads.filter(l => l.status === "NEW").length;
        const pendingLeadsCount = allLeads.filter(l => l.status === "CONTACTED").length;
        const convertedLeadsCount = allLeads.filter(l => l.status === "CONVERTED").length;

        const totalDeals = allDeals.length;
        const openDealsCount = allDeals.filter(d => !["WON", "LOST"].includes(d.stage)).length;
        const wonDeals = allDeals.filter(d => d.stage === "WON");
        const wonDealsCount = wonDeals.length;
        const totalRevenue = wonDeals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
        const pipelineValue = allDeals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
        const conversionRate = totalDeals > 0 ? ((wonDealsCount / totalDeals) * 100).toFixed(1) : 0;

        const recentLeadsFormatted = allLeads.slice(0, 6).map(formatLead);

        const leadsByStatus = [
            {
                label: "Active",
                count: activeLeadsCount,
                percentage: totalLeads > 0 ? Math.round((activeLeadsCount / totalLeads) * 100) : 0,
                color: "#2563eb"
            },
            {
                label: "Pending",
                count: pendingLeadsCount,
                percentage: totalLeads > 0 ? Math.round((pendingLeadsCount / totalLeads) * 100) : 0,
                color: "#f59e0b"
            },
            {
                label: "Qualified",
                count: qualifiedLeadsCount,
                percentage: totalLeads > 0 ? Math.round((qualifiedLeadsCount / totalLeads) * 100) : 0,
                color: "#10b981"
            }
        ];

        return res.status(200).json(
            new ApiResponse(200, [], {
                totalLeads,
                qualifiedLeads: qualifiedLeadsCount,
                activeLeads: activeLeadsCount,
                openDeals: openDealsCount,
                totalDeals,
                wonDeals: wonDealsCount,
                totalRevenue,
                pipelineValue,
                conversionRate: `${conversionRate}%`,
                recentLeads: recentLeadsFormatted,
                leadsByStatus,
                deals: allDeals.map(formatDeal)
            }, "Dashboard metrics retrieved successfully")
        );
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve dashboard metrics"));
    }
};

/**
 * GET /export-report
 * Exports comprehensive CRM report data for the authenticated organisation.
 */
export const exportReport = asyncHandler(async (req, res) => {
    const orgId = req.organizationId || req.user?.organizationId;
    if (!orgId) {
        throw new ApiError(400, "Organization ID is required to export reports");
    }

    const [leads, deals, tasks, org] = await Promise.all([
        prisma.lead.findMany({
            where: { organizationId: orgId },
            include: LEAD_INCLUDE,
            orderBy: { createdAt: "desc" },
        }),
        prisma.deal.findMany({
            where: { organizationId: orgId },
            include: DEAL_INCLUDE,
            orderBy: { createdAt: "desc" },
        }),
        prisma.task.findMany({
            where: { organizationId: orgId },
            include: {
                assignedTo: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.organization.findUnique({
            where: { id: orgId },
            select: { name: true, email: true, website: true, status: true },
        }),
    ]);

    const wonDeals = deals.filter((d) => d.stage === "WON");
    const totalRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const pipelineValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

    const reportData = {
        organization: org?.name || "CRM Organization",
        organizationDetails: org,
        generatedAt: new Date().toISOString(),
        summary: {
            totalLeads: leads.length,
            qualifiedLeads: leads.filter((l) => l.status === "QUALIFIED").length,
            totalDeals: deals.length,
            wonDeals: wonDeals.length,
            totalRevenue,
            pipelineValue,
            totalTasks: tasks.length,
            completedTasks: tasks.filter((t) => t.status === "COMPLETED").length,
        },
        leads: leads.map(formatLead),
        deals: deals.map(formatDeal),
        tasks,
    };

    return res.status(200).json(
        new ApiResponse(200, reportData, "Client Admin report generated successfully")
    );
});

/* ──────────────────────────────────────────────────────────────
 * Leads CRUD
 *
 * All handlers:
 *  - Use asyncHandler so errors reach the central errorHandler.
 *  - Source organizationId from req.organizationId (set by
 *    requireClientAdmin middleware) – never from the request body.
 *  - Apply organisation-scoped WHERE clauses on every DB query.
 *  - Perform explicit ownership checks before update/delete.
 *  - Accept only permitted fields (no mass assignment).
 * ──────────────────────────────────────────────────────────────*/

/**
 * GET /leads
 * List leads scoped to the authenticated organisation.
 * Supports pagination (req.pagination), sorting (req.sorting),
 * and optional query filters: status, source, assignedToId.
 */
export const listLeads = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const { page, limit, skip } = req.pagination;
    const { sortBy, sortOrder } = req.sorting;
    const { status, source, assignedToId } = req.query;

    const where = { organizationId: orgId };

    if (status) {
        where.status = mapLeadStatus(status);
    }
    if (source) {
        where.source = mapLeadSource(source);
    }
    if (assignedToId) {
        where.assignedToId = assignedToId;
    }

    const [leads, total] = await Promise.all([
        prisma.lead.findMany({
            where,
            include: LEAD_INCLUDE,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        prisma.lead.count({ where }),
    ]);

    // Spread ApiResponse to add pagination metadata without changing
    // the existing data shape (data remains the leads array).
    const response = new ApiResponse(200, [], leads.map(formatLead), "Leads retrieved successfully");
    return res.status(200).json({
        ...response,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    });
});

/**
 * GET /leads/:id
 * Retrieve a single lead by ID, scoped to the authenticated organisation.
 */
export const getLead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.organizationId;

    const lead = await prisma.lead.findFirst({
        where: { id, organizationId: orgId },
        include: LEAD_INCLUDE,
    });

    if (!lead) {
        throw new ApiError(404, "Lead not found");
    }

    return res.status(200).json(
        new ApiResponse(200, [], formatLead(lead), "Lead retrieved successfully")
    );
});

/**
 * POST /leads
 * Create a new lead for the authenticated organisation.
 * Only permitted fields are accepted (prevents mass assignment).
 * organisationId is always sourced from the authenticated context.
 */
export const createLead = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;

    // Permitted fields only – prevents mass assignment.
    const {
        title,
        name,
        description,
        status,
        source,
        companyId,
        contactId,
        assignedToId,
    } = req.body;

    const leadTitle = (title || name)?.trim();

    if (!leadTitle) {
        throw new ApiError(400, "Lead title is required");
    }

    // Map through existing helpers to normalise enum strings.
    const mappedStatus = status !== undefined ? mapLeadStatus(status) : "NEW";
    const mappedSource = source !== undefined ? mapLeadSource(source) : "OTHER";

    // Cross-reference checks: related records must belong to this organisation.
    if (companyId) {
        const company = await prisma.company.findFirst({
            where: { id: companyId, organizationId: orgId },
        });
        if (!company) {
            throw new ApiError(400, "Company not found in your organisation");
        }
    }

    if (contactId) {
        const contact = await prisma.contact.findFirst({
            where: { id: contactId, company: { organizationId: orgId } },
        });
        if (!contact) {
            throw new ApiError(400, "Contact not found in your organisation");
        }
    }

    if (assignedToId) {
        const assignee = await prisma.user.findFirst({
            where: { id: assignedToId, organizationId: orgId },
        });
        if (!assignee) {
            throw new ApiError(400, "Assigned user not found in your organisation");
        }
    }

    const lead = await prisma.lead.create({
        data: {
            title: leadTitle,
            description: description?.trim() || null,
            status: mappedStatus,
            source: mappedSource,
            organizationId: orgId,
            ...(companyId && { companyId }),
            ...(contactId && { contactId }),
            ...(assignedToId && { assignedToId }),
        },
        include: LEAD_INCLUDE,
    });

    return res.status(201).json(
        new ApiResponse(201, [], formatLead(lead), "Lead created successfully")
    );
});

/**
 * PATCH /leads/:id
 * Update an existing lead, verifying organisation ownership first.
 * title takes precedence over name (fixes original ordering bug).
 */
export const updateLead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.organizationId;

    // findFirst with org scope returns null for cross-org or nonexistent IDs.
    const existing = await prisma.lead.findFirst({
        where: { id, organizationId: orgId },
    });

    if (!existing) {
        throw new ApiError(404, "Lead not found");
    }

    // Permitted fields only – prevents mass assignment.
    const {
        title,
        name,
        description,
        status,
        source,
        companyId,
        contactId,
        assignedToId,
    } = req.body;

    // title takes explicit precedence over name.
    const newTitle = title?.trim() || name?.trim();

    // Validate cross-org references when explicitly provided.
    if (companyId !== undefined && companyId !== null) {
        const company = await prisma.company.findFirst({
            where: { id: companyId, organizationId: orgId },
        });
        if (!company) {
            throw new ApiError(400, "Company not found in your organisation");
        }
    }

    if (contactId !== undefined && contactId !== null) {
        const contact = await prisma.contact.findFirst({
            where: { id: contactId, company: { organizationId: orgId } },
        });
        if (!contact) {
            throw new ApiError(400, "Contact not found in your organisation");
        }
    }

    if (assignedToId !== undefined && assignedToId !== null) {
        const assignee = await prisma.user.findFirst({
            where: { id: assignedToId, organizationId: orgId },
        });
        if (!assignee) {
            throw new ApiError(400, "Assigned user not found in your organisation");
        }
    }

    const updateData = {
        ...(newTitle && { title: newTitle }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status: mapLeadStatus(status) }),
        ...(source !== undefined && { source: mapLeadSource(source) }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(contactId !== undefined && { contactId: contactId || null }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
    };

    const lead = await prisma.lead.update({
        where: { id },
        data: updateData,
        include: LEAD_INCLUDE,
    });

    return res.status(200).json(
        new ApiResponse(200, [], formatLead(lead), "Lead updated successfully")
    );
});

/**
 * DELETE /leads/:id
 * Delete a lead after verifying organisation ownership.
 */
export const deleteLead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.organizationId;

    // findFirst with org scope returns null for cross-org or nonexistent IDs.
    const existing = await prisma.lead.findFirst({
        where: { id, organizationId: orgId },
    });

    if (!existing) {
        throw new ApiError(404, "Lead not found");
    }

    await prisma.lead.delete({ where: { id } });

    return res.status(200).json(
        new ApiResponse(200, [], null, "Lead deleted successfully")
    );
});

/* ──────────────────────────────────────────────────────────────
 * Deals CRUD
 *
 * All handlers:
 *  - Use asyncHandler so errors reach the central errorHandler.
 *  - Source organizationId from req.organizationId (set by
 *    requireClientAdmin middleware) – never from the request body.
 *  - Apply organisation-scoped WHERE clauses on every DB query.
 *  - Perform explicit ownership checks before update/delete.
 *  - Accept only permitted fields (no mass assignment).
 * ──────────────────────────────────────────────────────────────*/

/**
 * GET /deals
 * List deals scoped to the authenticated organisation.
 * Supports pagination (req.pagination), sorting (req.sorting),
 * and optional query filters: stage, assignedToId, customerId.
 */
export const listDeals = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const { page = 1, limit = 10, skip = 0 } = req.pagination || {};
    const { sortBy = "createdAt", sortOrder = "desc" } = req.sorting || {};
    const { stage, assignedToId, customerId } = req.query;

    const where = { organizationId: orgId };

    if (stage) {
        where.stage = mapDealStage(stage);
    }
    if (assignedToId) {
        where.assignedToId = assignedToId;
    }
    if (customerId) {
        where.customerId = customerId;
    }

    const [deals, total] = await Promise.all([
        prisma.deal.findMany({
            where,
            include: DEAL_INCLUDE,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        prisma.deal.count({ where }),
    ]);

    const response = new ApiResponse(200, [], deals.map(formatDeal), "Deals retrieved successfully");
    return res.status(200).json({
        ...response,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    });
});

/**
 * GET /deals/:id
 * Retrieve a single deal by ID, scoped to the authenticated organisation.
 */
export const getDeal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.organizationId;

    const deal = await prisma.deal.findFirst({
        where: { id, organizationId: orgId },
        include: DEAL_INCLUDE,
    });

    if (!deal) {
        throw new ApiError(404, "Deal not found");
    }

    return res.status(200).json(
        new ApiResponse(200, [], formatDeal(deal), "Deal retrieved successfully")
    );
});

/**
 * POST /deals
 * Create a new deal for the authenticated organisation.
 * Only permitted fields are accepted (prevents mass assignment).
 * organizationId is always sourced from the authenticated context.
 */
export const createDeal = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;

    const {
        title,
        description,
        value,
        stage,
        probability,
        company,
        companyId,
        contact,
        owner,
        expectedCloseDate,
        customerId,
        assignedToId,
    } = req.body;

    const dealTitle = title?.trim();
    if (!dealTitle) {
        throw new ApiError(400, "Deal title is required");
    }

    let resolvedCustomerId = customerId;
    if (resolvedCustomerId) {
        const customer = await prisma.customer.findFirst({
            where: { id: resolvedCustomerId, organizationId: orgId },
        });
        if (!customer) {
            throw new ApiError(400, "Customer not found in your organisation");
        }
    } else if (companyId) {
        const comp = await prisma.company.findFirst({
            where: { id: companyId, organizationId: orgId },
        });
        if (!comp) {
            throw new ApiError(400, "Company not found in your organisation");
        }
        let cust = await prisma.customer.findFirst({
            where: { companyId, organizationId: orgId },
        });
        if (!cust) {
            cust = await prisma.customer.create({
                data: { companyId, organizationId: orgId },
            });
        }
        resolvedCustomerId = cust.id;
    } else {
        const compName = (typeof company === "string" && company.trim()) || "Client Corporation";
        let comp = await prisma.company.findFirst({
            where: { name: compName, organizationId: orgId },
        });
        if (!comp) {
            comp = await prisma.company.create({
                data: { name: compName, organizationId: orgId },
            });
        }
        let cust = await prisma.customer.findFirst({
            where: { companyId: comp.id, organizationId: orgId },
        });
        if (!cust) {
            cust = await prisma.customer.create({
                data: { companyId: comp.id, organizationId: orgId },
            });
        }
        resolvedCustomerId = cust.id;
    }

    if (assignedToId) {
        const assignee = await prisma.user.findFirst({
            where: { id: assignedToId, organizationId: orgId },
        });
        if (!assignee) {
            throw new ApiError(400, "Assigned user not found in your organisation");
        }
    }

    const compName = typeof company === "string" && company.trim() ? company.trim() : "Client Corporation";
    const metaPayload = {
        company: compName,
        contact: typeof contact === "string" ? contact.trim() : "Primary Contact",
        owner: typeof owner === "string" ? owner.trim() : "Ravi Kiran",
        probability: probability !== undefined ? Number(probability) : 60,
        expectedCloseDate: expectedCloseDate || new Date().toISOString().split("T")[0],
    };
    const descPayload = description && !description.startsWith("{") ? description : JSON.stringify(metaPayload);

    const deal = await prisma.deal.create({
        data: {
            title: dealTitle,
            description: descPayload,
            value: value !== undefined ? Number(value) : 0,
            stage: stage ? mapDealStage(stage) : "PROSPECTING",
            customerId: resolvedCustomerId,
            organizationId: orgId,
            ...(assignedToId && { assignedToId }),
        },
        include: DEAL_INCLUDE,
    });

    return res.status(201).json(
        new ApiResponse(201, [], formatDeal(deal), "Deal created successfully")
    );
});

/**
 * PATCH /deals/:id
 * Update an existing deal after verifying organisation ownership.
 */
export const updateDeal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.organizationId;

    const existing = await prisma.deal.findFirst({
        where: { id, organizationId: orgId },
    });

    if (!existing) {
        throw new ApiError(404, "Deal not found");
    }

    const {
        title,
        description,
        value,
        stage,
        probability,
        company,
        contact,
        owner,
        expectedCloseDate,
        customerId,
        assignedToId,
    } = req.body;

    if (customerId !== undefined && customerId !== null) {
        const cust = await prisma.customer.findFirst({
            where: { id: customerId, organizationId: orgId },
        });
        if (!cust) {
            throw new ApiError(400, "Customer not found in your organisation");
        }
    }

    if (assignedToId !== undefined && assignedToId !== null) {
        const assignee = await prisma.user.findFirst({
            where: { id: assignedToId, organizationId: orgId },
        });
        if (!assignee) {
            throw new ApiError(400, "Assigned user not found in your organisation");
        }
    }

    let existingMeta = {};
    if (existing.description) {
        try {
            if (existing.description.startsWith("{")) existingMeta = JSON.parse(existing.description);
        } catch (e) {}
    }

    const updatedMeta = {
        ...existingMeta,
        ...(company !== undefined && { company: typeof company === "string" ? company.trim() : company }),
        ...(contact !== undefined && { contact: typeof contact === "string" ? contact.trim() : contact }),
        ...(owner !== undefined && { owner: typeof owner === "string" ? owner.trim() : owner }),
        ...(probability !== undefined && { probability: Number(probability) }),
        ...(expectedCloseDate !== undefined && { expectedCloseDate }),
    };

    const updateData = {
        ...(title && { title: title.trim() }),
        description: description && !description.startsWith("{") ? description : JSON.stringify(updatedMeta),
        ...(value !== undefined && { value: Number(value) }),
        ...(stage && { stage: mapDealStage(stage) }),
        ...(customerId !== undefined && { customerId }),
        ...(assignedToId !== undefined && { assignedToId }),
    };

    const deal = await prisma.deal.update({
        where: { id },
        data: updateData,
        include: DEAL_INCLUDE,
    });

    return res.status(200).json(
        new ApiResponse(200, [], formatDeal(deal), "Deal updated successfully")
    );
});

/**
 * DELETE /deals/:id
 * Delete a deal after verifying organisation ownership.
 */
export const deleteDeal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.organizationId;

    const existing = await prisma.deal.findFirst({
        where: { id, organizationId: orgId },
    });

    if (!existing) {
        throw new ApiError(404, "Deal not found");
    }

    await prisma.deal.delete({ where: { id } });

    return res.status(200).json(
        new ApiResponse(200, [], null, "Deal deleted successfully")
    );
});


const mapTaskStatus = (st) => {
    const s = String(st || '').toUpperCase().trim();
    if (['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(s)) return s;
    if (s === 'OPEN' || s === 'PENDING') return 'TODO';
    if (s === 'DONE' || s === 'COMPLETE') return 'COMPLETED';
    return 'TODO';
};

const formatTask = (t) => {
    let extraMeta = {};
    if (t.description) {
        try {
            if (t.description.startsWith('{')) extraMeta = JSON.parse(t.description);
            else extraMeta = { notes: t.description };
        } catch (e) {}
    }

    const clientName = extraMeta.client || t.lead?.title || t.customer?.company?.name || 'General';
    const assignedName = t.assignedTo
        ? `${t.assignedTo.firstName || ''} ${t.assignedTo.lastName || ''}`.trim()
        : (extraMeta.assignedTo || 'Sarah Jenkins');
    const priorityVal = extraMeta.priority || 'Medium';
    let dueStr = extraMeta.due;
    if (!dueStr && t.dueDate) {
        try {
            dueStr = new Date(t.dueDate).toLocaleDateString();
        } catch (e) {}
    }
    if (!dueStr) dueStr = 'Upcoming';

    return {
        id: t.id,
        title: t.title,
        client: clientName,
        assignedTo: assignedName,
        due: dueStr,
        priority: priorityVal.charAt(0).toUpperCase() + priorityVal.slice(1).toLowerCase(),
        completed: t.status === 'COMPLETED',
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
    };
};

/* ──────────────────────────────────────────────────────────────
 * Tasks CRUD
 *
 * All handlers:
 *  - Use asyncHandler so errors reach the central errorHandler.
 *  - Source organizationId from req.organizationId (set by
 *    requireClientAdmin middleware) – never from the request body.
 *  - Apply organisation-scoped WHERE clauses on every DB query.
 *  - Perform explicit ownership checks before update/delete.
 *  - Accept only permitted fields (no mass assignment).
 * ──────────────────────────────────────────────────────────────*/

/**
 * GET /tasks
 * List tasks scoped to the authenticated organisation.
 * Supports pagination (req.pagination), sorting (req.sorting),
 * and optional query filters: status, assignedToId.
 */
export const getTasks = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const { page = 1, limit = 20, skip = 0 } = req.pagination || {};
    const { sortBy = "createdAt", sortOrder = "desc" } = req.sorting || {};
    const { status, assignedToId } = req.query;

    const where = { organizationId: orgId };

    if (status) {
        where.status = mapTaskStatus(status);
    }
    if (assignedToId) {
        where.assignedToId = assignedToId;
    }

    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,
            include: {
                assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
                lead: true,
                customer: { include: { company: true } },
            },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        prisma.task.count({ where }),
    ]);

    const response = new ApiResponse(200, [], tasks.map(formatTask), "Tasks retrieved successfully");
    return res.status(200).json({
        ...response,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    });
});

/**
 * POST /tasks
 * Create a new task for the authenticated organisation.
 * Permitted fields only – prevents mass assignment.
 * organizationId is always sourced from the authenticated context.
 */
export const createTask = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const userId = req.crmUser?.id;

    // Permitted fields only.
    const {
        title,
        description,
        status = "TODO",
        dueDate,
        assignedToId,
        leadId,
        customerId,
        dealId,
        // Display-only metadata fields (stored in JSON description)
        client,
        assignedTo: assignedToName,
        due,
        priority = "Medium",
    } = req.body;

    if (!title || !String(title).trim()) {
        throw new ApiError(400, "Task title is required");
    }

    const targetAssignedToId = assignedToId || userId;

    // Validate cross-org references.
    if (assignedToId) {
        const assignee = await prisma.user.findFirst({
            where: { id: assignedToId, organizationId: orgId },
        });
        if (!assignee) {
            throw new ApiError(400, "Assigned user not found in your organisation");
        }
    }

    if (leadId) {
        const lead = await prisma.lead.findFirst({
            where: { id: leadId, organizationId: orgId },
        });
        if (!lead) {
            throw new ApiError(400, "Lead not found in your organisation");
        }
    }

    if (customerId) {
        const customer = await prisma.customer.findFirst({
            where: { id: customerId, organizationId: orgId },
        });
        if (!customer) {
            throw new ApiError(400, "Customer not found in your organisation");
        }
    }

    if (dealId) {
        const deal = await prisma.deal.findFirst({
            where: { id: dealId, organizationId: orgId },
        });
        if (!deal) {
            throw new ApiError(400, "Deal not found in your organisation");
        }
    }

    // Build description with display metadata.
    const metaPayload = {
        client: client || 'General',
        assignedTo: assignedToName || 'Unassigned',
        due: due || (dueDate ? new Date(dueDate).toLocaleDateString() : 'Upcoming'),
        priority: priority || 'Medium',
    };
    const descPayload = description && !String(description).startsWith('{') ? description : JSON.stringify(metaPayload);

    let parsedDueDate = null;
    if (dueDate) {
        const d = new Date(dueDate);
        if (!isNaN(d.getTime())) parsedDueDate = d;
    }

    const task = await prisma.task.create({
        data: {
            title: String(title).trim(),
            description: descPayload,
            status: mapTaskStatus(status),
            dueDate: parsedDueDate,
            organizationId: orgId,
            assignedToId: targetAssignedToId,
            ...(leadId && { leadId }),
            ...(customerId && { customerId }),
            ...(dealId && { dealId }),
        },
        include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
            lead: true,
        },
    });

    return res.status(201).json(new ApiResponse(201, [], formatTask(task), "Task created successfully"));
});


export const updateTask = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;

    const existing = await prisma.task.findFirst({
        where: { id: req.params.id, organizationId: orgId },
    });
    if (!existing) {
        throw new ApiError(404, "Task not found");
    }

    let existingMeta = {};
    if (existing.description) {
        try {
            if (existing.description.startsWith('{')) existingMeta = JSON.parse(existing.description);
        } catch (e) {}
    }

    // Permitted fields only.
    const {
        title,
        description,
        status,
        dueDate,
        assignedToId,
        leadId,
        customerId,
        dealId,
        client,
        assignedTo: assignedToName,
        due,
        priority,
    } = req.body;

    // Validate cross-org references when provided.
    if (assignedToId !== undefined && assignedToId !== null) {
        const assignee = await prisma.user.findFirst({
            where: { id: assignedToId, organizationId: orgId },
        });
        if (!assignee) {
            throw new ApiError(400, "Assigned user not found in your organisation");
        }
    }

    const updatedMeta = {
        ...existingMeta,
        ...(client !== undefined && { client }),
        ...(assignedToName !== undefined && { assignedTo: assignedToName }),
        ...(due !== undefined && { due }),
        ...(priority !== undefined && { priority }),
    };

    // Use explicit description if provided (not JSON), otherwise use merged meta.
    const descPayload = description && !String(description).startsWith('{') ? description : JSON.stringify(updatedMeta);

    const updateData = {
        ...(title && { title: String(title).trim() }),
        description: descPayload,
        ...(status !== undefined && { status: mapTaskStatus(status) }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(leadId !== undefined && { leadId }),
        ...(customerId !== undefined && { customerId }),
        ...(dealId !== undefined && { dealId }),
    };

    if (dueDate !== undefined) {
        const parsed = new Date(dueDate);
        if (!isNaN(parsed.getTime())) updateData.dueDate = parsed;
        else if (dueDate === null) updateData.dueDate = null;
    } else if (due !== undefined) {
        const parsed = new Date(due);
        if (!isNaN(parsed.getTime())) updateData.dueDate = parsed;
    }

    const updated = await prisma.task.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
            lead: true,
        },
    });

    return res.status(200).json(new ApiResponse(200, [], formatTask(updated), "Task updated successfully"));
});


export const deleteTask = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;

    const existing = await prisma.task.findFirst({
        where: { id: req.params.id, organizationId: orgId },
    });
    if (!existing) {
        throw new ApiError(404, "Task not found");
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    return res.status(200).json(new ApiResponse(200, [], null, "Task deleted successfully"));
});



const TEAM_INCLUDE = {
    members: {
        include: {
            user: {
                select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
        },
    },
    _count: { select: { members: true } },
};

/**
 * GET /team
 * List all teams for the authenticated organisation.
 */
export const getTeams = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const { page = 1, limit = 20, skip = 0 } = req.pagination || {};

    const [teams, total] = await Promise.all([
        prisma.team.findMany({
            where: { organizationId: orgId },
            include: TEAM_INCLUDE,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.team.count({ where: { organizationId: orgId } }),
    ]);

    const response = new ApiResponse(200, [], teams, "Teams retrieved successfully");
    return res.status(200).json({ ...response, total, page, limit });
});


export const createTeam = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;

    // Permitted fields only.
    const { name, memberIds } = req.body;

    const teamName = (name || '').trim();
    if (!teamName) {
        throw new ApiError(400, "Team name is required");
    }

    // Validate member IDs belong to this org when provided.
    if (Array.isArray(memberIds) && memberIds.length > 0) {
        const validMembers = await prisma.user.findMany({
            where: { id: { in: memberIds }, organizationId: orgId },
            select: { id: true },
        });
        if (validMembers.length !== memberIds.length) {
            throw new ApiError(400, "One or more member IDs are not valid users in your organisation");
        }
    }

    const team = await prisma.team.create({
        data: {
            name: teamName,
            organizationId: orgId,
            ...(Array.isArray(memberIds) && memberIds.length > 0 && {
                members: {
                    create: memberIds.map((userId) => ({ userId })),
                },
            }),
        },
        include: TEAM_INCLUDE,
    });

    return res.status(201).json(new ApiResponse(201, [], team, "Team created successfully"));
});


export const updateTeam = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;

    const existing = await prisma.team.findFirst({
        where: { id: req.params.id, organizationId: orgId },
    });
    if (!existing) {
        throw new ApiError(404, "Team not found");
    }

    // Permitted fields only – no mass assignment.
    const { name } = req.body;
    const newName = (name || '').trim();
    if (!newName) {
        throw new ApiError(400, "Team name is required");
    }

    const updated = await prisma.team.update({
        where: { id: req.params.id },
        data: { name: newName },
        include: TEAM_INCLUDE,
    });

    return res.status(200).json(new ApiResponse(200, [], updated, "Team updated successfully"));
});

/**
 * DELETE /team/:id
 * Delete a team after verifying organisation ownership.
 */
export const deleteTeam = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;

    const existing = await prisma.team.findFirst({
        where: { id: req.params.id, organizationId: orgId },
    });
    if (!existing) {
        throw new ApiError(404, "Team not found");
    }

    // Clean up team memberships before deleting team to avoid foreign key RESTRICT constraint violation.
    if (prisma.teamMembership?.deleteMany) {
        await prisma.teamMembership.deleteMany({ where: { teamId: req.params.id } });
    }

    await prisma.team.delete({ where: { id: req.params.id } });
    return res.status(200).json(new ApiResponse(200, [], null, "Team deleted successfully"));
});


const PRODUCT_PERMITTED_FIELDS = new Set(["name", "category", "price", "billing", "inventory", "status"]);

let inMemoryProducts = [
    { id: "PRD-001", name: "CRM Enterprise Suite", category: "Software & SaaS", price: "₹85,000 / mo", billing: "Annual Billing", inventory: "Enterprise Edition · Unlimited Seats", status: "Active" },
    { id: "PRD-002", name: "Cloud Pipeline Automation", category: "Cloud Services", price: "₹45,000 / mo", billing: "Monthly Billing", inventory: "Standard Tier · Up to 50 Pipelines", status: "Active" },
    { id: "PRD-003", name: "AI Lead Scoring Engine", category: "AI & Intelligence", price: "₹60,000 / mo", billing: "Quarterly Billing", inventory: "Add-on · Real-time Analytics", status: "Active" },
    { id: "PRD-004", name: "ERP Sync Integration Connector", category: "Integration", price: "₹35,000 / mo", billing: "Annual Billing", inventory: "Connector Module · Multi-platform", status: "Active" },
    { id: "PRD-005", name: "Omnichannel Helpdesk & Tickets", category: "Customer Support", price: "₹50,000 / mo", billing: "Annual Billing", inventory: "Support Suite · 24/7 SLA", status: "Active" },
    { id: "PRD-006", name: "Custom Workflow Consulting", category: "Professional Services", price: "₹1,20,000", billing: "One-Time", inventory: "Implementation Package · 40 hrs", status: "Active" },
];

/**
 * GET /products
 * List products (in-memory). Route-level requirePermission("products:read") enforced.
 */
export const listProducts = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, [], inMemoryProducts, "Products retrieved successfully"));
});

/**
 * POST /products
 * Create a product. Permitted fields: name, category, price, billing, inventory, status.
 * Route-level validateBody({ required: ["name"], allowedFields: [...] }) enforced.
 */
export const createProduct = asyncHandler(async (req, res) => {
    // Extract only permitted fields – no mass assignment.
    const { name, category, price, billing, inventory, status } = req.body;

    if (!name || !String(name).trim()) {
        throw new ApiError(400, "Product name is required");
    }

    const newProduct = {
        id: `PRD-${String(inMemoryProducts.length + 1).padStart(3, '0')}`,
        name: String(name).trim(),
        category: category || 'Software & SaaS',
        price: price || '₹50,000 / mo',
        billing: billing || 'Annual Billing',
        inventory: inventory || 'Standard Tier',
        status: status === 'INACTIVE' || status === 'Inactive' ? 'Inactive' : 'Active',
    };
    inMemoryProducts.push(newProduct);
    return res.status(201).json(new ApiResponse(201, [], newProduct, "Product created successfully"));
});

/**
 * PATCH /products/:id
 * Update a product. Only permitted fields are applied – no mass assignment.
 * Route-level validateBody({ allowedFields: [...] }) enforced.
 */
export const updateProduct = asyncHandler(async (req, res) => {
    const index = inMemoryProducts.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        throw new ApiError(404, "Product not found");
    }

    // Extract only permitted fields.
    const updateFields = {};
    for (const key of PRODUCT_PERMITTED_FIELDS) {
        if (req.body[key] !== undefined) {
            updateFields[key] = req.body[key];
        }
    }

    inMemoryProducts[index] = { ...inMemoryProducts[index], ...updateFields };
    return res.status(200).json(new ApiResponse(200, [], inMemoryProducts[index], "Product updated successfully"));
});

/**
 * DELETE /products/:id
 * Delete a product. Route-level requirePermission("products:delete") enforced.
 */
export const deleteProduct = asyncHandler(async (req, res) => {
    const index = inMemoryProducts.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        throw new ApiError(404, "Product not found");
    }
    inMemoryProducts = inMemoryProducts.filter(p => p.id !== req.params.id);
    return res.status(200).json(new ApiResponse(200, [], null, "Product deleted successfully"));
});

/* ==========================================================================
   Employees Directory Handlers (Employee.jsx)
   ========================================================================== */
const employeeMetaStore = new Map();

/* ──────────────────────────────────────────────────────────────
 * Employees Directory Handlers (Employee.jsx)
 *
 * All handlers:
 *  - Use asyncHandler so errors reach the central errorHandler.
 *  - Source organizationId from req.organizationId.
 *  - Enforce org isolation on reads, updates, and deletes.
 *  - Use explicit permitted-field destructuring (no mass assignment).
 *
 * Firebase UID strategy:
 *  - createEmployee stores a placeholder UID (`invite-<uuid>`) to
 *    satisfy the unique constraint.  A real Firebase user should
 *    be created via an invitation flow and the UID updated at
 *    acceptance.  No passwords or credentials are stored here.
 * ──────────────────────────────────────────────────────────────*/

/**
 * GET /employee
 * List employees (users) scoped to the authenticated organisation.
 */
export const listEmployee = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const { page = 1, limit = 20, skip = 0 } = req.pagination || {};

    const [employees, total] = await Promise.all([
        prisma.user.findMany({
            where: { organizationId: orgId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.user.count({ where: { organizationId: orgId } }),
    ]);

    const formatted = employees.map(emp => {
        const meta = employeeMetaStore.get(emp.id) || {};
        return {
            id: emp.id,
            name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email,
            email: emp.email,
            role: meta.displayRole || (emp.role === 'ORGANIZATION_ADMIN' ? 'Regional Manager' : emp.role === 'MANAGER' ? 'Senior Account Manager' : 'Business Development'),
            department: meta.department || (emp.role === 'ORGANIZATION_ADMIN' ? 'Executive' : emp.role === 'MANAGER' ? 'Sales & Accounts' : 'Enterprise Sales'),
            phone: meta.phone || '+91 98000 00000',
            status: meta.displayStatus || (emp.status === 'ACTIVE' ? 'Full-time' : emp.status === 'INVITED' ? 'Contract' : 'Part-time'),
            dbRole: emp.role,
            dbStatus: emp.status,
            createdAt: emp.createdAt,
        };
    });

    const response = new ApiResponse(200, [], formatted, "Employees retrieved successfully");
    return res.status(200).json({ ...response, total, page, limit });
});

/**
 * POST /employee
 * Create a new employee (User) in the authenticated organisation.
 *
 * A placeholder Firebase UID is stored.  The actual Firebase user
 * should be created separately via an invitation flow.
 */
export const createEmployee = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;

    // Permitted fields only.
    const {
        name,
        firstName,
        lastName,
        email,
        role: displayRole = "Account Executive",
        status: displayStatus = "Full-time",
        department = "Sales & Accounts",
        phone = "+91 98000 00000",
    } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
        throw new ApiError(400, "Email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    let fName = firstName || "";
    let lName = lastName || "";
    if (name && !firstName) {
        const parts = String(name).trim().split(/\s+/);
        fName = parts[0] || "";
        lName = parts.slice(1).join(" ") || "";
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
        throw new ApiError(409, "A user with this email already exists");
    }

    // Map display role to valid Prisma UserRole enum.
    // Only MANAGER and SALES are valid non-admin roles for employee creation.
    const prismaRole = validateUserRole(displayRole) ? displayRole : "SALES";

    // Store a placeholder Firebase UID.  Must be replaced when the real
    // Firebase user is created via invitation acceptance.
    const placeholderUid = `invite-${crypto.randomUUID()}`;

    const newEmployee = await prisma.user.create({
        data: {
            firebaseUid: placeholderUid,
            email: normalizedEmail,
            firstName: fName || "New",
            lastName: lName || "Employee",
            role: prismaRole,
            status: "INVITED",
            organizationId: orgId,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true,
        },
    });

    // Save display-only metadata (not persisted to User table).
    employeeMetaStore.set(newEmployee.id, {
        displayRole,
        displayStatus,
        department,
        phone,
    });

    const formatted = {
        id: newEmployee.id,
        name: `${newEmployee.firstName} ${newEmployee.lastName}`.trim(),
        email: newEmployee.email,
        role: displayRole,
        department,
        phone,
        status: displayStatus,
        dbRole: newEmployee.role,
        dbStatus: newEmployee.status,
        createdAt: newEmployee.createdAt,
    };

    return res.status(201).json(new ApiResponse(201, [], formatted, "Employee created successfully"));
});

/**
 * PATCH /employee/:id
 * Update an employee in the authenticated organisation.
 * Org isolation is enforced before update.
 */
export const updateEmployee = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const currentUserId = req.crmUser?.id;
    const { id } = req.params;

    // Ownership check: must belong to this org.
    const target = await prisma.user.findFirst({
        where: { id, organizationId: orgId },
    });
    if (!target) {
        throw new ApiError(404, "Employee not found");
    }

    // Cannot modify yourself or another ORGANIZATION_ADMIN via this endpoint.
    if (target.id === currentUserId || target.role === "ORGANIZATION_ADMIN") {
        throw new ApiError(403, "This account cannot be modified via the employee directory");
    }

    // Permitted fields only.
    const {
        name,
        firstName,
        lastName,
        email,
        role: dbRole,
        status: dbStatus,
        displayRole,
        displayStatus,
        department,
        phone,
    } = req.body;

    let fName = firstName;
    let lName = lastName;
    if (name !== undefined && firstName === undefined) {
        const parts = String(name).trim().split(/\s+/);
        fName = parts[0] || "";
        lName = parts.slice(1).join(" ") || "";
    }

    // Only apply valid Prisma enum values for role/status.
    const normalizedRole = dbRole !== undefined ? (validateUserRole(dbRole) ? dbRole : undefined) : undefined;
    const normalizedStatus = dbStatus !== undefined ? (validateUserStatus(dbStatus) ? dbStatus : undefined) : undefined;

    const updated = await prisma.user.update({
        where: { id },
        data: {
            ...(fName !== undefined && { firstName: fName }),
            ...(lName !== undefined && { lastName: lName }),
            ...(email !== undefined && { email: email.trim().toLowerCase() }),
            ...(normalizedRole !== undefined && { role: normalizedRole }),
            ...(normalizedStatus !== undefined && { status: normalizedStatus }),
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            updatedAt: true,
        },
    });

    const currentMeta = employeeMetaStore.get(id) || {};
    const newMeta = {
        ...currentMeta,
        ...(displayRole !== undefined && { displayRole }),
        ...(displayStatus !== undefined && { displayStatus }),
        ...(department !== undefined && { department }),
        ...(phone !== undefined && { phone }),
    };
    employeeMetaStore.set(id, newMeta);

    const formatted = {
        id: updated.id,
        name: `${updated.firstName} ${updated.lastName}`.trim(),
        email: updated.email,
        role: newMeta.displayRole || updated.role,
        department: newMeta.department || 'Sales & Accounts',
        phone: newMeta.phone || '+91 98000 00000',
        status: newMeta.displayStatus || (updated.status === 'ACTIVE' ? 'Full-time' : 'Contract'),
        dbRole: updated.role,
        dbStatus: updated.status,
        updatedAt: updated.updatedAt,
    };

    return res.status(200).json(new ApiResponse(200, [], formatted, "Employee updated successfully"));
});

/**
 * DELETE /employee/:id
 * Delete an employee in the authenticated organisation.
 * Org isolation is enforced before delete.
 */
export const deleteEmployee = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const currentUserId = req.crmUser?.id;
    const { id } = req.params;

    const target = await prisma.user.findFirst({
        where: { id, organizationId: orgId },
    });
    if (!target) {
        throw new ApiError(404, "Employee not found");
    }

    // Cannot delete yourself or another ORGANIZATION_ADMIN.
    if (target.id === currentUserId || target.role === "ORGANIZATION_ADMIN") {
        throw new ApiError(403, "This account cannot be deleted via the employee directory");
    }

    await prisma.user.delete({ where: { id } });
    return res.status(200).json(new ApiResponse(200, [], null, "Employee deleted successfully"));
});

// Aliases matching plural naming conventions
export const updateEmployees = updateEmployee;
export const deleteEmployees = deleteEmployee;

/* ==========================================================================
   Profile, Password & Settings Handlers (Settings.jsx)
   ========================================================================== */

/**
 * PATCH /profile
 * Update the authenticated user's profile.
 *
 * Supported fields: firstName, lastName, name (split to first/last), email, orgName.
 *
 * NOTE: The User model has no `phone` column. The `phone` field supplied
 * in the request body is NOT persisted to the database. It is echoed
 * back in the response for frontend display compatibility only.
 * To persist phone data, a schema migration adding `phone String?` to
 * the User model is required.
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const userId = req.crmUser?.id || req.user?.id;

    // Permitted fields only – no mass assignment.
    const { name, firstName, lastName, email, phone, orgName } = req.body;

    let fName = firstName;
    let lName = lastName;
    if (name !== undefined && firstName === undefined) {
        const parts = String(name).trim().split(/\s+/);
        fName = parts[0] || "";
        lName = parts.slice(1).join(" ") || "";
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(fName !== undefined && { firstName: fName }),
            ...(lName !== undefined && { lastName: lName }),
            ...(email !== undefined && { email: email.trim().toLowerCase() }),
            // phone is NOT in the User schema – not passed to Prisma.
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            organizationId: true,
        },
    });

    if (orgName && orgId) {
        await prisma.organization.update({
            where: { id: orgId },
            data: { name: String(orgName).trim() },
        });
    }

    return res.status(200).json(
        new ApiResponse(200, [], {
            name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
            email: updatedUser.email,
            // phone is echoed from request (not stored); frontend compatibility.
            phone: phone || null,
            role: updatedUser.role,
            orgName: orgName || null,
        }, "Profile updated successfully")
    );
});

export const updatePassword = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json(new ApiResponse(400, [{ message: "New password must be at least 8 characters long" }], null, "Invalid password"));
        }

        // If firebase auth is active, update password in firebase auth service
        if (auth && typeof auth.updateUser === "function" && req.user.uid && !req.user.uid.startsWith("dev-")) {
            await auth.updateUser(req.user.uid, { password: newPassword });
        }

        return res.status(200).json(new ApiResponse(200, [], null, "Password updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to update password"));
    }
};

let portalSettings = {
    platformName: "SHNOOR CRM",
    supportEmail: "support@shnoor.com",
    defaultPlan: "Starter",
    allowSignup: true,
    emailAlerts: true,
    maintenanceMode: false,
    notifications: {
        highPriorityLeads: true,
        dealStageWonLost: true,
        weeklyDigest: false,
    }
};

export const getSettings = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        let orgDetails = null;
        if (result.user.organizationId) {
            orgDetails = await prisma.organization.findUnique({
                where: { id: result.user.organizationId },
                select: { name: true, email: true, status: true }
            });
        }

        const userProfile = {
            name: `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim() || 'Client Admin',
            email: result.user.email,
            phone: '+91 98000 00000',
            designation: result.user.role === 'ORGANIZATION_ADMIN' ? 'Client Administrator' : 'Sales Lead',
            role: result.user.role || 'ORGANIZATION_ADMIN',
            orgName: orgDetails?.name || 'SHNOOR CRM'
        };

        const combined = {
            ...portalSettings,
            platformName: orgDetails?.name || portalSettings.platformName,
            supportEmail: orgDetails?.email || portalSettings.supportEmail,
            profile: userProfile
        };

        return res.status(200).json(new ApiResponse(200, [], combined, "Settings retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve settings"));
    }
};

/**
 * PATCH /settings
 * Update portal settings for the authenticated organisation.
 *
 * Explicit allowlist prevents mass assignment and privilege escalation.
 * Protected fields (organizationId, role, etc.) are never accepted.
 */
const SETTINGS_PERMITTED_FIELDS = new Set([
    "platformName",
    "supportEmail",
    "defaultPlan",
    "allowSignup",
    "emailAlerts",
    "maintenanceMode",
    "notifications",
]);

export const updateSettings = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;

    // Apply only permitted settings fields – no mass assignment.
    const appliedChanges = {};
    for (const key of SETTINGS_PERMITTED_FIELDS) {
        if (req.body[key] !== undefined) {
            appliedChanges[key] = req.body[key];
        }
    }

    if (Object.keys(appliedChanges).length === 0) {
        throw new ApiError(400, "No valid settings fields provided");
    }

    // Handle nested notifications merge safely.
    if (appliedChanges.notifications !== null && typeof appliedChanges.notifications === "object") {
        appliedChanges.notifications = {
            ...portalSettings.notifications,
            ...appliedChanges.notifications,
        };
    }

    portalSettings = { ...portalSettings, ...appliedChanges };

    // Persist org-level fields to the database.
    if (orgId && (appliedChanges.platformName || appliedChanges.supportEmail)) {
        await prisma.organization.update({
            where: { id: orgId },
            data: {
                ...(appliedChanges.platformName && { name: String(appliedChanges.platformName).trim() }),
                ...(appliedChanges.supportEmail && { email: String(appliedChanges.supportEmail).trim() }),
            },
        });
    }

    return res.status(200).json(new ApiResponse(200, [], portalSettings, "Settings updated successfully"));
});







/* ==========================================================================
   Users Management CRUD
   ========================================================================== */

export const listUsers = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(403, [{ message: result.error }], null, result.error)
            );
        }

        const users = await prisma.user.findMany({
            where: {
                ...(result.user.organizationId
                    ? { organizationId: result.user.organizationId }
                    : {})
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: "desc" }
        });

        return res.status(200).json(
            new ApiResponse(200, [], users, "Users retrieved successfully")
        );
    } catch (error) {
        console.error("List users error:", error);
        return res.status(500).json(
            new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve users")
        );
    }
};

export const getUser = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(403, [{ message: result.error }], null, result.error)
            );
        }

        const user = await prisma.user.findFirst({
            where: {
                id: req.params.id,
                ...(result.user.organizationId
                    ? { organizationId: result.user.organizationId }
                    : {})
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json(
                new ApiResponse(404, [{ message: "User not found" }], null, "User not found")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, [], user, "User retrieved successfully")
        );
    } catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json(
            new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve user")
        );
    }
};

export const createUser = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(403, [{ message: result.error }], null, result.error)
            );
        }

        const {
            name,
            firstName,
            lastName,
            email,
            role = "SALES",
            status = "ACTIVE"
        } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).json(
                new ApiResponse(400, [{ message: "Email is required" }], null, "Email is required")
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existing) {
            return res.status(409).json(
                new ApiResponse(409, [{ message: "Email already exists" }], null, "Email already exists")
            );
        }

        let fName = firstName || "";
        let lName = lastName || "";

        if (name && !firstName) {
            const parts = name.trim().split(/\s+/);
            fName = parts[0] || "";
            lName = parts.slice(1).join(" ");
        }

        // Valid Prisma UserRole and UserStatus enum values.
        const allowedRoles = ["SALES", "MANAGER"];
        // INACTIVE is not a valid UserStatus enum value — valid values are:
        // INVITED, ACTIVE, SUSPENDED, DEACTIVATED
        const allowedStatuses = ["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json(
                new ApiResponse(400, [{ message: "Invalid role" }], null, "Invalid role")
            );
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json(
                new ApiResponse(400, [{ message: "Invalid status" }], null, "Invalid status")
            );
        }

        if (!result.user.organizationId) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: "Organization Admin is not assigned to an organization" }],
                    null,
                    "Organization Admin is not assigned to an organization"
                )
            );
        }

        const user = await prisma.user.create({
            data: {
                firebaseUid: `pending-${crypto.randomUUID()}`,
                email: normalizedEmail,
                firstName: fName,
                lastName: lName,
                role,
                status,
                organizationId: result.user.organizationId
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true
            }
        });

        return res.status(201).json(
            new ApiResponse(201, [], user, "User created successfully")
        );
    } catch (error) {
        console.error("Create user error:", error);
        return res.status(500).json(
            new ApiResponse(500, [{ message: error.message }], null, "Failed to create user")
        );
    }
};

export const updateUser = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(403, [{ message: result.error }], null, result.error)
            );
        }

        const { id } = req.params;
        const { name, firstName, lastName, email, role, status } = req.body;

        const target = await prisma.user.findFirst({
            where: {
                id,
                ...(result.user.organizationId
                    ? { organizationId: result.user.organizationId }
                    : {})
            }
        });

        if (!target) {
            return res.status(404).json(
                new ApiResponse(404, [{ message: "User not found" }], null, "User not found")
            );
        }

        if (
            target.id === result.user.id ||
            ["ADMIN", "SUPER_ADMIN", "ORGANIZATION_ADMIN"].includes(target.role)
        ) {
            return res.status(403).json(
                new ApiResponse(403, [{ message: "This account cannot be modified here" }], null, "Modification disallowed")
            );
        }

        let fName = firstName;
        let lName = lastName;

        if (name !== undefined && firstName === undefined) {
            const parts = name.trim().split(/\s+/);
            fName = parts[0] || "";
            lName = parts.slice(1).join(" ");
        }

        if (role !== undefined && !["SALES", "MANAGER"].includes(role)) {
            return res.status(400).json(
                new ApiResponse(400, [{ message: "Invalid role" }], null, "Invalid role")
            );
        }

        // INACTIVE is not a valid UserStatus enum value.
        if (status !== undefined && !["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"].includes(status)) {
            return res.status(400).json(
                new ApiResponse(400, [{ message: "Invalid status" }], null, "Invalid status")
            );
        }

        const normalizedEmail =
            email !== undefined ? email.trim().toLowerCase() : undefined;

        if (normalizedEmail && normalizedEmail !== target.email) {
            const existing = await prisma.user.findUnique({
                where: { email: normalizedEmail }
            });

            if (existing) {
                return res.status(409).json(
                    new ApiResponse(409, [{ message: "Email already exists" }], null, "Email already exists")
                );
            }
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...(fName !== undefined && { firstName: fName }),
                ...(lName !== undefined && { lastName: lName }),
                ...(normalizedEmail !== undefined && { email: normalizedEmail }),
                ...(role !== undefined && { role }),
                ...(status !== undefined && { status })
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                updatedAt: true
            }
        });

        return res.status(200).json(
            new ApiResponse(200, [], updated, "User updated successfully")
        );
    } catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json(
            new ApiResponse(500, [{ message: error.message }], null, "Failed to update user")
        );
    }
};

export const updateUserStatus = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(403, [{ message: result.error }], null, result.error)
            );
        }

        const { id } = req.params;
        const { status } = req.body;

        // INACTIVE is not a valid UserStatus enum value.
        if (!["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"].includes(status)) {
            return res.status(400).json(
                new ApiResponse(400, [{ message: "Invalid status" }], null, "Invalid status")
            );
        }

        const target = await prisma.user.findFirst({
            where: {
                id,
                ...(result.user.organizationId
                    ? { organizationId: result.user.organizationId }
                    : {})
            }
        });

        if (!target) {
            return res.status(404).json(
                new ApiResponse(404, [{ message: "User not found" }], null, "User not found")
            );
        }

        if (
            target.id === result.user.id ||
            ["ADMIN", "SUPER_ADMIN", "ORGANIZATION_ADMIN"].includes(target.role)
        ) {
            return res.status(403).json(
                new ApiResponse(403, [{ message: "This account status cannot be changed here" }], null, "Status change disallowed")
            );
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                updatedAt: true
            }
        });

        return res.status(200).json(
            new ApiResponse(200, [], updated, "User status updated successfully")
        );
    } catch (error) {
        console.error("Update user status error:", error);
        return res.status(500).json(
            new ApiResponse(500, [{ message: error.message }], null, "Failed to update user status")
        );
    }
};

export const deleteUser = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(403, [{ message: result.error }], null, result.error)
            );
        }

        const { id } = req.params;

        const target = await prisma.user.findFirst({
            where: {
                id,
                ...(result.user.organizationId
                    ? { organizationId: result.user.organizationId }
                    : {})
            }
        });

        if (!target) {
            return res.status(404).json(
                new ApiResponse(404, [{ message: "User not found" }], null, "User not found")
            );
        }

        if (
            target.id === result.user.id ||
            ["ADMIN", "SUPER_ADMIN", "ORGANIZATION_ADMIN"].includes(target.role)
        ) {
            return res.status(403).json(
                new ApiResponse(403, [{ message: "This account cannot be deleted here" }], null, "Deletion disallowed")
            );
        }

        await prisma.user.delete({ where: { id } });

        return res.status(200).json(
            new ApiResponse(200, [], null, "User deleted successfully")
        );
    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json(
            new ApiResponse(500, [{ message: error.message }], null, "Failed to delete user")
        );
    }
};

export const getProfile = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user?.uid, req.user?.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const user = await prisma.user.findUnique({
            where: { id: result.user.id },
            select: { firstName: true, lastName: true, email: true, phone: true, role: true, organizationId: true },
        });
        const organization = user?.organizationId
            ? await prisma.organization.findUnique({ where: { id: user.organizationId }, select: { name: true } })
            : null;
        const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || "Client Admin";

        return res.status(200).json(
            new ApiResponse(200, [], {
                id: result.user.id,
                name,
                email: user?.email || req.user?.email,
                phone: user?.phone || "",
                designation: user?.role === "ORGANIZATION_ADMIN" ? "Client Administrator" : "Sales Lead",
                organizationName: organization?.name || "SHNOOR CRM",
                orgName: organization?.name || "SHNOOR CRM",
                role: user?.role || result.user.role,
            }, "Profile retrieved successfully")
        );
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve profile"));
    }
};
export const listCustomers = async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            include: { company: true, tasks: true, activities: true },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json(new ApiResponse(200, [], customers, "Customers retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve customers"));
    }
};



export const listCompanies = async (req, res) => {
    try {
        const companies = await prisma.company.findMany({
            include: { contacts: true, customers: true, leads: true },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json(new ApiResponse(200, [], companies, "Companies retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve companies"));
    }
};



export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) return res.status(404).json(new ApiResponse(404, [], null, "Customer not found"));

        const updated = await prisma.customer.update({
            where: { id },
            data: { ...(status && { status }) }
        });
        return res.status(200).json(new ApiResponse(200, [], updated, "Customer updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to update customer"));
    }
};



export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) return res.status(404).json(new ApiResponse(404, [], null, "Customer not found"));

        await prisma.customer.delete({ where: { id } });
        return res.status(200).json(new ApiResponse(200, [], null, "Customer deleted successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to delete customer"));
    }
};

