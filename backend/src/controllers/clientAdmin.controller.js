import crypto from "crypto";
import prisma from "../db/index.js";
import { ApiResponse } from "../utils/apiResponse.js";

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
const formatLead = (l) => {
    let extraMeta = {};
    if (l.description) {
        try {
            if (l.description.startsWith('{')) {
                extraMeta = JSON.parse(l.description);
            }
        } catch (e) {}
    }

    const contactName = l.contact?.name || extraMeta.contact || extraMeta.contactPerson || 'Direct Contact';
    const email = l.contact?.email || extraMeta.email || 'contact@lead.com';
    const phone = l.contact?.phone || extraMeta.phone || '-';
    const tier = extraMeta.tier || 'Growth';
    const numVal = Number(extraMeta.value ?? extraMeta.numericValue) || 0;
    const assignedName = l.assignedTo
        ? `${l.assignedTo.firstName || ''} ${l.assignedTo.lastName || ''}`.trim()
        : (extraMeta.assignedTo || 'Unassigned');

    const formattedStatus = l.status === 'NEW' ? 'Active' : (l.status ? (l.status.charAt(0) + l.status.slice(1).toLowerCase()) : 'Active');
    const formattedSource = l.source ? (l.source.charAt(0) + l.source.slice(1).toLowerCase().replace('_', ' ')) : 'Website';

    const nameStr = l.title || 'Untitled Lead';
    const initials = nameStr.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'LE';
    const stLower = formattedStatus.toLowerCase();
    const stType = stLower === 'active' ? 'active' : (stLower === 'qualified' ? 'qualified' : 'pending');

    return {
        id: l.id,
        name: l.title,
        title: l.title,
        contact: contactName,
        email,
        phone,
        tier,
        avatarInitials: initials,
        value: numVal ? `$${numVal.toLocaleString()}` : '$0',
        numericValue: numVal,
        status: formattedStatus,
        statusType: stType,
        source: formattedSource,
        assignedTo: assignedName,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt
    };
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
        const result = await getClientAdmin(req.user.uid, req.user.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const [
            allLeads,
            allDeals
        ] = await Promise.all([
            prisma.lead.findMany({
                include: { company: true, contact: true, assignedTo: true },
                orderBy: { createdAt: "desc" }
            }),
            prisma.deal.findMany({
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

export const listLeads = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const leads = await prisma.lead.findMany({
            include: {
                company: true,
                contact: true,
                assignedTo: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                leads.map(formatLead),
                "Leads retrieved successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to retrieve leads"
            )
        );
    }
};

/* Leads CRUD */
export const createLead = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const { title, name, description, status, source, contact, email, phone, tier, value, numericValue, assignedTo, companyId, contactId, assignedToId } = req.body;
        const leadTitle = title || name;
        if (!leadTitle) {
            return res.status(400).json(new ApiResponse(400, [{ message: "Title is required" }], null, "Missing title"));
        }

        let orgId = result.user.organizationId;
        if (!orgId) {
            const org = await prisma.organization.findFirst();
            orgId = org ? org.id : (await prisma.organization.create({ data: { name: "SHNOOR CRM Organization", status: "ACTIVE" } })).id;
        }

        const metaPayload = {
            contact: contact || null,
            email: email || null,
            phone: phone || null,
            tier: tier || 'Growth',
            value: Number(value || numericValue) || 0,
            assignedTo: assignedTo || null,
        };
        const descPayload = description && !description.startsWith('{') ? description : JSON.stringify(metaPayload);

        let resolvedContactId = contactId || null;
        if (!resolvedContactId && (contact || email)) {
            try {
                let comp = await prisma.company.findFirst({ where: { name: leadTitle, organizationId: orgId } });
                if (!comp) {
                    comp = await prisma.company.create({
                        data: {
                            name: leadTitle,
                            email: email || null,
                            phone: phone || null,
                            organizationId: orgId,
                        }
                    });
                }
                const newContact = await prisma.contact.create({
                    data: {
                        name: contact || 'Direct Contact',
                        email: email || null,
                        phone: phone || null,
                        companyId: comp.id,
                    }
                });
                resolvedContactId = newContact.id;
            } catch (err) {
                // non-blocking
            }
        }

        const lead = await prisma.lead.create({
            data: {
                title: leadTitle,
                description: descPayload,
                status: mapLeadStatus(status),
                source: mapLeadSource(source),
                organizationId: orgId,
                ...(companyId && { companyId }),
                ...(resolvedContactId && { contactId: resolvedContactId }),
                ...(assignedToId && { assignedToId }),
            },
            include: { company: true, contact: true, assignedTo: true }
        });

        return res.status(201).json(new ApiResponse(201, [], formatLead(lead), "Lead created successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to create lead"));
    }
};

export const updateLead = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json(new ApiResponse(404, [{ message: "Lead not found" }], null, "Lead not found"));
        }

        let existingMeta = {};
        if (existing.description) {
            try {
                if (existing.description.startsWith('{')) existingMeta = JSON.parse(existing.description);
            } catch (e) {}
        }

        const { title, name, description, status, source, contact, email, phone, tier, value, numericValue, assignedTo } = req.body;
        const updatedMeta = {
            ...existingMeta,
            ...(contact !== undefined && { contact }),
            ...(email !== undefined && { email }),
            ...(phone !== undefined && { phone }),
            ...(tier !== undefined && { tier }),
            ...(value !== undefined && { value: Number(value) }),
            ...(numericValue !== undefined && { value: Number(numericValue) }),
            ...(assignedTo !== undefined && { assignedTo }),
        };

        const lead = await prisma.lead.update({
            where: { id: req.params.id },
            data: {
                ...(title && { title }),
                ...(name && { title: name }),
                description: JSON.stringify(updatedMeta),
                ...(status && { status: mapLeadStatus(status) }),
                ...(source && { source: mapLeadSource(source) }),
            },
            include: { company: true, contact: true, assignedTo: true }
        });

        return res.status(200).json(new ApiResponse(200, [], formatLead(lead), "Lead updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to update lead"));
    }
};

export const deleteLead = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        await prisma.lead.delete({ where: { id: req.params.id } });
        return res.status(200).json(new ApiResponse(200, [], null, "Lead deleted successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to delete lead"));
    }
};

/* Deals CRUD */


export const listDeals = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const deals = await prisma.deal.findMany({
            include: {
                customer: { include: { company: true } },
                assignedTo: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json(new ApiResponse(200, [], deals.map(formatDeal), "Deals retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve deals"));
    }
};

export const createDeal = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const { title, description, value, stage, probability, company, contact, owner, expectedCloseDate, customerId, assignedToId } = req.body;
        if (!title) {
            return res.status(400).json(new ApiResponse(400, [{ message: "Deal title is required" }], null, "Missing title"));
        }

        let orgId = result.user.organizationId;
        if (!orgId) {
            const org = await prisma.organization.findFirst();
            orgId = org ? org.id : (await prisma.organization.create({ data: { name: "SHNOOR CRM Organization", status: "ACTIVE" } })).id;
        }

        // Auto-resolve customerId if not provided
        let resolvedCustomerId = customerId;
        const compName = company || 'Client Corporation';
        if (!resolvedCustomerId) {
            let comp = await prisma.company.findFirst({ where: { name: compName, organizationId: orgId } });
            if (!comp) {
                comp = await prisma.company.create({ data: { name: compName, organizationId: orgId } });
            }
            let cust = await prisma.customer.findFirst({ where: { companyId: comp.id, organizationId: orgId } });
            if (!cust) {
                cust = await prisma.customer.create({ data: { companyId: comp.id, organizationId: orgId } });
            }
            resolvedCustomerId = cust.id;
        }

        const metaPayload = {
            company: compName,
            contact: contact || 'Primary Contact',
            owner: owner || 'Ravi Kiran',
            probability: Number(probability) || 60,
            expectedCloseDate: expectedCloseDate || new Date().toISOString().split('T')[0]
        };
        const descPayload = description && !description.startsWith('{') ? description : JSON.stringify(metaPayload);

        const deal = await prisma.deal.create({
            data: {
                title,
                description: descPayload,
                value: Number(value) || 0,
                stage: mapDealStage(stage),
                customerId: resolvedCustomerId,
                organizationId: orgId,
                ...(assignedToId && { assignedToId }),
            },
            include: { customer: { include: { company: true } }, assignedTo: true }
        });

        return res.status(201).json(new ApiResponse(201, [], formatDeal(deal), "Deal created successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to create deal"));
    }
};

export const updateDeal = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const existing = await prisma.deal.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json(new ApiResponse(404, [{ message: "Deal not found" }], null, "Deal not found"));
        }

        let existingMeta = {};
        if (existing.description) {
            try {
                if (existing.description.startsWith('{')) existingMeta = JSON.parse(existing.description);
            } catch (e) {}
        }

        const { title, description, value, stage, probability, company, contact, owner, expectedCloseDate } = req.body;
        const updatedMeta = {
            ...existingMeta,
            ...(company !== undefined && { company }),
            ...(contact !== undefined && { contact }),
            ...(owner !== undefined && { owner }),
            ...(probability !== undefined && { probability: Number(probability) }),
            ...(expectedCloseDate !== undefined && { expectedCloseDate })
        };

        const deal = await prisma.deal.update({
            where: { id: req.params.id },
            data: {
                ...(title && { title }),
                description: JSON.stringify(updatedMeta),
                ...(value !== undefined && { value: Number(value) }),
                ...(stage && { stage: mapDealStage(stage) })
            },
            include: { customer: { include: { company: true } }, assignedTo: true }
        });

        return res.status(200).json(new ApiResponse(200, [], formatDeal(deal), "Deal updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to update deal"));
    }
};

export const deleteDeal = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        await prisma.deal.delete({ where: { id: req.params.id } });
        return res.status(200).json(new ApiResponse(200, [], null, "Deal deleted successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to delete deal"));
    }
};

/* Tasks CRUD (for Tasks.jsx) */
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

export const getTasks = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const tasks = await prisma.task.findMany({
            include: {
                assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
                lead: true,
                customer: { include: { company: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return res.status(200).json(new ApiResponse(200, [], tasks.map(formatTask), "Tasks retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve tasks"));
    }
};

export const createTask = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const { title, client, assignedTo, due, dueDate, priority = "Medium", status = "TODO", description, assignedToId, leadId, dealId } = req.body;
        if (!title) {
            return res.status(400).json(new ApiResponse(400, [{ message: "Task title is required" }], null, "Missing title"));
        }

        let orgId = result.user.organizationId;
        if (!orgId) {
            const org = await prisma.organization.findFirst();
            orgId = org ? org.id : (await prisma.organization.create({ data: { name: "SHNOOR CRM Organization", status: "ACTIVE" } })).id;
        }

        const targetAssignedToId = assignedToId || result.user.id;

        const metaPayload = {
            client: client || 'General',
            assignedTo: assignedTo || `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim() || 'Sarah Jenkins',
            due: due || (dueDate ? new Date(dueDate).toLocaleDateString() : 'Upcoming'),
            priority: priority || 'Medium',
        };
        const descPayload = description && !description.startsWith('{') ? description : JSON.stringify(metaPayload);

        let parsedDueDate = null;
        if (dueDate) {
            const d = new Date(dueDate);
            if (!isNaN(d.getTime())) parsedDueDate = d;
        } else if (due) {
            const d = new Date(due);
            if (!isNaN(d.getTime())) parsedDueDate = d;
        }

        const task = await prisma.task.create({
            data: {
                title,
                description: descPayload,
                status: mapTaskStatus(status),
                dueDate: parsedDueDate,
                organizationId: orgId,
                assignedToId: targetAssignedToId,
                ...(leadId && { leadId }),
                ...(dealId && { dealId }),
            },
            include: { assignedTo: true, lead: true }
        });

        return res.status(201).json(new ApiResponse(201, [], formatTask(task), "Task created successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to create task"));
    }
};

export const updateTask = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json(new ApiResponse(404, [{ message: "Task not found" }], null, "Task not found"));
        }

        let existingMeta = {};
        if (existing.description) {
            try {
                if (existing.description.startsWith('{')) existingMeta = JSON.parse(existing.description);
            } catch (e) {}
        }

        const { title, client, assignedTo, due, dueDate, priority, status } = req.body;
        const updatedMeta = {
            ...existingMeta,
            ...(client !== undefined && { client }),
            ...(assignedTo !== undefined && { assignedTo }),
            ...(due !== undefined && { due }),
            ...(priority !== undefined && { priority })
        };

        const updateData = {
            ...(title && { title }),
            description: JSON.stringify(updatedMeta),
            ...(status !== undefined && { status: mapTaskStatus(status) })
        };

        if (dueDate !== undefined || due !== undefined) {
            const candidate = dueDate || due;
            const parsed = new Date(candidate);
            if (!isNaN(parsed.getTime())) updateData.dueDate = parsed;
        }

        const updated = await prisma.task.update({
            where: { id: req.params.id },
            data: updateData,
            include: { assignedTo: true, lead: true }
        });

        return res.status(200).json(new ApiResponse(200, [], formatTask(updated), "Task updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to update task"));
    }
};

export const deleteTask = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        await prisma.task.delete({ where: { id: req.params.id } });
        return res.status(200).json(new ApiResponse(200, [], null, "Task deleted successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to delete task"));
    }
};

/* Teams CRUD (for Teams.jsx) */
let inMemoryTeamMembers = [
    { id: 'TM-01', name: 'Sarah Jenkins', role: 'Sales Lead', email: 'sarah.j@crmclient.com', territory: 'APAC / Regional', dealsClosed: 5, revenueWon: '₹42.5L', status: 'Active' },
    { id: 'TM-02', name: 'David Miller', role: 'Account Executive', email: 'david.m@crmclient.com', territory: 'North America', dealsClosed: 9, revenueWon: '₹28.0L', status: 'Active' },
    { id: 'TM-03', name: 'Elena Rostova', role: 'Customer Success', email: 'elena.r@crmclient.com', territory: 'EMEA Enterprise', dealsClosed: 2, revenueWon: '₹34.2L', status: 'Active' },
    { id: 'TM-04', name: 'Marcus Vance', role: 'Senior Sales Rep', email: 'marcus.v@crmclient.com', territory: 'ANZ Commercial', dealsClosed: 7, revenueWon: '₹61.0L', status: 'Active' },
    { id: 'TM-05', name: 'Ravi Kiran', role: 'Regional Sales VP', email: 'ravi.k@crmclient.com', territory: 'India Strategic', dealsClosed: 4, revenueWon: '₹75.4L', status: 'Active' },
    { id: 'TM-06', name: 'Meena Patel', role: 'Enterprise Strategist', email: 'meena.p@crmclient.com', territory: 'Global Accounts', dealsClosed: 6, revenueWon: '₹53.8L', status: 'Active' },
];

export const getTeams = async (req, res) => {
    return res.status(200).json(new ApiResponse(200, [], inMemoryTeamMembers, "Team members retrieved successfully"));
};

export const createTeam = async (req, res) => {
    try {
        const { name, firstName, lastName, email, role = 'Account Executive', territory = 'APAC / Regional', dealsClosed = 0, revenueWon = '₹0.0L', status = 'Active' } = req.body;
        const memberName = name || `${firstName || ''} ${lastName || ''}`.trim();
        if (!memberName && !email) {
            return res.status(400).json(new ApiResponse(400, [{ message: "Name or email is required" }], null, "Missing fields"));
        }

        const newMember = {
            id: `TM-${String(inMemoryTeamMembers.length + 1).padStart(2, '0')}`,
            name: memberName || email.split('@')[0],
            role,
            email: email || '',
            territory: territory || 'APAC / Regional',
            dealsClosed: Number(dealsClosed) || 0,
            revenueWon: String(revenueWon || '₹0.0L'),
            status: status === 'ACTIVE' || status === 'Active' ? 'Active' : 'Inactive',
            createdAt: new Date().toISOString()
        };

        inMemoryTeamMembers.push(newMember);
        return res.status(201).json(new ApiResponse(201, [], newMember, "Team member added successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to create team member"));
    }
};

export const updateTeam = async (req, res) => {
    const index = inMemoryTeamMembers.findIndex(m => m.id === req.params.id);
    if (index !== -1) {
        inMemoryTeamMembers[index] = { ...inMemoryTeamMembers[index], ...req.body };
        return res.status(200).json(new ApiResponse(200, [], inMemoryTeamMembers[index], "Team member updated successfully"));
    }
    return res.status(404).json(new ApiResponse(404, [{ message: "Team member not found" }], null, "Team member not found"));
};

export const deleteTeam = async (req, res) => {
    inMemoryTeamMembers = inMemoryTeamMembers.filter(m => m.id !== req.params.id);
    return res.status(200).json(new ApiResponse(200, [], null, "Team member deleted successfully"));
};

/* Products Catalog (for Products.jsx) */
let inMemoryProducts = [
    { id: "PRD-001", name: "CRM Enterprise Suite", category: "Software & SaaS", price: "₹85,000 / mo", billing: "Annual Billing", inventory: "Enterprise Edition · Unlimited Seats", status: "Active" },
    { id: "PRD-002", name: "Cloud Pipeline Automation", category: "Cloud Services", price: "₹45,000 / mo", billing: "Monthly Billing", inventory: "Standard Tier · Up to 50 Pipelines", status: "Active" },
    { id: "PRD-003", name: "AI Lead Scoring Engine", category: "AI & Intelligence", price: "₹60,000 / mo", billing: "Quarterly Billing", inventory: "Add-on · Real-time Analytics", status: "Active" },
    { id: "PRD-004", name: "ERP Sync Integration Connector", category: "Integration", price: "₹35,000 / mo", billing: "Annual Billing", inventory: "Connector Module · Multi-platform", status: "Active" },
    { id: "PRD-005", name: "Omnichannel Helpdesk & Tickets", category: "Customer Support", price: "₹50,000 / mo", billing: "Annual Billing", inventory: "Support Suite · 24/7 SLA", status: "Active" },
    { id: "PRD-006", name: "Custom Workflow Consulting", category: "Professional Services", price: "₹1,20,000", billing: "One-Time", inventory: "Implementation Package · 40 hrs", status: "Active" },
];

export const listProducts = async (req, res) => {
    return res.status(200).json(new ApiResponse(200, [], inMemoryProducts, "Products retrieved successfully"));
};

export const createProduct = async (req, res) => {
    const { name, category, price, billing, inventory, status } = req.body;
    const newProduct = {
        id: `PRD-${String(inMemoryProducts.length + 1).padStart(3, '0')}`,
        name: name || 'Unnamed Product',
        category: category || 'Software & SaaS',
        price: price || '₹50,000 / mo',
        billing: billing || 'Annual Billing',
        inventory: inventory || 'Standard Tier',
        status: status === 'INACTIVE' || status === 'Inactive' ? 'Inactive' : 'Active'
    };
    inMemoryProducts.push(newProduct);
    return res.status(201).json(new ApiResponse(201, [], newProduct, "Product created successfully"));
};

export const updateProduct = async (req, res) => {
    const index = inMemoryProducts.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        inMemoryProducts[index] = { ...inMemoryProducts[index], ...req.body };
        return res.status(200).json(new ApiResponse(200, [], inMemoryProducts[index], "Product updated successfully"));
    }
    return res.status(404).json(new ApiResponse(404, [{ message: "Product not found" }], null, "Product not found"));
};

export const deleteProduct = async (req, res) => {
    inMemoryProducts = inMemoryProducts.filter(p => p.id !== req.params.id);
    return res.status(200).json(new ApiResponse(200, [], null, "Product deleted successfully"));
};

/* ==========================================================================
   Employees Directory Handlers (Employee.jsx)
   ========================================================================== */
const employeeMetaStore = new Map();

export const listEmployee = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const employees = await prisma.user.findMany({
            where: {
                ...(result.user.organizationId ? { organizationId: result.user.organizationId } : {}),
            },
            select: {
                id: true,
                firebaseUid: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" }
        });

        // Format employee data for Employee.jsx frontend
        const formatted = employees.map(emp => {
            const meta = employeeMetaStore.get(emp.id) || {};
            return {
                id: emp.id,
                name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email,
                email: emp.email,
                role: meta.role || (emp.role === 'ORGANIZATION_ADMIN' ? 'Regional Manager' : emp.role === 'MANAGER' ? 'Senior Account Manager' : 'Business Development'),
                department: meta.department || (emp.role === 'ORGANIZATION_ADMIN' ? 'Executive' : emp.role === 'MANAGER' ? 'Sales & Accounts' : 'Enterprise Sales'),
                phone: meta.phone || '+91 98000 00000',
                status: meta.status || (emp.status === 'ACTIVE' ? 'Full-time' : emp.status === 'INVITED' ? 'Contract' : 'Part-time'),
                createdAt: emp.createdAt
            };
        });

        return res.status(200).json(new ApiResponse(200, [], formatted, "Employees retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve employees"));
    }
};

export const createEmployee = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const { name, firstName, lastName, email, role = "Account Executive", status = "Full-time", department = "Sales & Accounts", phone = "+91 98000 00000" } = req.body;

        if (!email) {
            return res.status(400).json(new ApiResponse(400, [{ message: "Email is required" }], null, "Missing email"));
        }

        // Split name into first/last name if full name string provided
        let fName = firstName || "";
        let lName = lastName || "";
        if (name && !firstName) {
            const parts = name.trim().split(" ");
            fName = parts[0] || "";
            lName = parts.slice(1).join(" ") || "";
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json(new ApiResponse(409, [{ message: "User with this email already exists" }], null, "Email in use"));
        }

        const validPrismaRole = ["ORGANIZATION_ADMIN", "ADMIN"].includes(role) ? "SALES" : (validateUserRole(role) ? role : "SALES");
        const validPrismaStatus = validateUserStatus(status) ? status : "ACTIVE";

        const newEmployee = await prisma.user.create({
            data: {
                firebaseUid: `emp-${crypto.randomUUID()}`,
                email,
                firstName: fName || "New",
                lastName: lName || "Employee",
                role: validPrismaRole,
                status: validPrismaStatus,
                ...(result.user.organizationId && { organizationId: result.user.organizationId })
            },
            select: {
                id: true,
                firebaseUid: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        // Save display metadata
        employeeMetaStore.set(newEmployee.id, {
            department,
            phone,
            role,
            status
        });

        const formatted = {
            id: newEmployee.id,
            name: `${newEmployee.firstName} ${newEmployee.lastName}`.trim(),
            email: newEmployee.email,
            role,
            department,
            phone,
            status,
            createdAt: newEmployee.createdAt
        };

        return res.status(201).json(new ApiResponse(201, [], formatted, "Employee created successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to create employee"));
    }
};

export const updateEmployee = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const { id } = req.params;
        const target = await prisma.user.findUnique({ where: { id } });
        if (!target) {
            return res.status(404).json(new ApiResponse(404, [{ message: "Employee not found" }], null, "Employee not found"));
        }

        if (target.role === "ADMIN" || target.id === result.user.id) {
            return res.status(403).json(new ApiResponse(403, [{ message: "Admin accounts cannot be modified via employee directory" }], null, "Modification disallowed"));
        }

        const { name, firstName, lastName, email, role, status, department, phone } = req.body;

        let fName = firstName;
        let lName = lastName;
        if (name !== undefined && !firstName) {
            const parts = name.trim().split(" ");
            fName = parts[0] || "";
            lName = parts.slice(1).join(" ") || "";
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...(fName !== undefined && { firstName: fName }),
                ...(lName !== undefined && { lastName: lName }),
                ...(email !== undefined && { email }),
                ...(role !== undefined && validateUserRole(role) && role !== "ADMIN" && { role }),
                ...(status !== undefined && validateUserStatus(status) && { status })
            },
            select: {
                id: true,
                firebaseUid: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        const currentMeta = employeeMetaStore.get(id) || {};
        const newMeta = {
            ...currentMeta,
            ...(department !== undefined && { department }),
            ...(phone !== undefined && { phone }),
            ...(role !== undefined && { role }),
            ...(status !== undefined && { status }),
        };
        employeeMetaStore.set(id, newMeta);

        const formatted = {
            id: updated.id,
            name: `${updated.firstName} ${updated.lastName}`.trim(),
            email: updated.email,
            role: newMeta.role || updated.role,
            department: newMeta.department || 'Sales & Accounts',
            phone: newMeta.phone || '+91 98000 00000',
            status: newMeta.status || (updated.status === 'ACTIVE' ? 'Full-time' : 'Contract'),
            updatedAt: updated.updatedAt
        };

        return res.status(200).json(new ApiResponse(200, [], formatted, "Employee updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to update employee"));
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const { id } = req.params;
        const target = await prisma.user.findUnique({ where: { id } });
        if (!target) {
            return res.status(404).json(new ApiResponse(404, [{ message: "Employee not found" }], null, "Employee not found"));
        }

        if (target.role === "ADMIN" || target.id === result.user.id) {
            return res.status(403).json(new ApiResponse(403, [{ message: "Admin accounts cannot be deleted" }], null, "Deletion disallowed"));
        }

        await prisma.user.delete({ where: { id } });
        return res.status(200).json(new ApiResponse(200, [], null, "Employee deleted successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to delete employee"));
    }
};

// Aliases matching plural naming conventions
export const updateEmployees = updateEmployee;
export const deleteEmployees = deleteEmployee;

/* ==========================================================================
   Profile, Password & Settings Handlers (Settings.jsx)
   ========================================================================== */

export const updateProfile = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const { name, firstName, lastName, email, phone, orgName } = req.body;

        let fName = firstName;
        let lName = lastName;
        if (name !== undefined && !firstName) {
            const parts = name.trim().split(" ");
            fName = parts[0] || "";
            lName = parts.slice(1).join(" ") || "";
        }

        const updatedUser = await prisma.user.update({
            where: { id: result.user.id },
            data: {
                ...(fName !== undefined && { firstName: fName }),
                ...(lName !== undefined && { lastName: lName }),
                ...(email !== undefined && { email }),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                organizationId: true
            }
        });

        if (orgName && result.user.organizationId) {
            await prisma.organization.update({
                where: { id: result.user.organizationId },
                data: { name: orgName }
            });
        }

        return res.status(200).json(
            new ApiResponse(200, [], {
                name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
                email: updatedUser.email,
                phone: phone || '+91 98000 00000',
                role: updatedUser.role,
                orgName: orgName || 'SHNOOR CRM'
            }, "Profile updated successfully")
        );
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to update profile"));
    }
};

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

export const updateSettings = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        portalSettings = { ...portalSettings, ...req.body };

        if (result.user.organizationId && (req.body.platformName || req.body.supportEmail)) {
            await prisma.organization.update({
                where: { id: result.user.organizationId },
                data: {
                    ...(req.body.platformName && { name: req.body.platformName }),
                    ...(req.body.supportEmail && { email: req.body.supportEmail }),
                }
            });
        }

        return res.status(200).json(new ApiResponse(200, [], portalSettings, "Settings updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to update settings"));
    }
};


