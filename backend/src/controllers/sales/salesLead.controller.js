import { LeadSource, LeadStatus } from "../../generated/prisma/client.ts";
import prisma from "../../db/index.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const leadRelations = {
    company: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            website: true,
            address: true,
            city: true,
            state: true,
            country: true,
        },
    },
    contact: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true,
            companyId: true,
        },
    },
    assignedTo: {
        select: { id: true, firstName: true, lastName: true },
    },
};

export const getSalesLeads = asyncHandler(async (req, res) => {
    const leads = await prisma.lead.findMany({
        where: { organizationId: req.organizationId },
        include: leadRelations,
        orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(
        new ApiResponse(200, [], leads, "Leads retrieved successfully")
    );
});

export const getSalesLeadById = asyncHandler(async (req, res) => {
    const lead = await prisma.lead.findFirst({
        where: { id: req.params.leadId, organizationId: req.organizationId },
        include: {
            ...leadRelations,
            convertedBy: {
                select: { id: true, firstName: true, lastName: true },
            },
            customer: {
                select: { id: true, companyId: true },
            },
            tasks: {
                where: { organizationId: req.organizationId },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    dueDate: true,
                },
                orderBy: { dueDate: "asc" },
            },
            activities: {
                where: {
                    organizationId: req.organizationId,
                    performedBy: { is: { organizationId: req.organizationId } },
                },
                select: {
                    id: true,
                    type: true,
                    description: true,
                    createdAt: true,
                    performedBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!lead) throw new ApiError(404, "Lead not found");

    return res.status(200).json(
        new ApiResponse(200, [], lead, "Lead retrieved successfully")
    );
});

export const createSalesLead = asyncHandler(async (req, res) => {
    const { title, description, source, company: companyInput, contact: contactInput } = req.body || {};

    if (!title?.trim()) throw new ApiError(400, "title is required");
    if (!Object.values(LeadSource).includes(source)) throw new ApiError(400, "Invalid lead source");
    if (!companyInput || !["existing", "new"].includes(companyInput.mode)) {
        throw new ApiError(400, "Choose an existing company or provide a new company");
    }
    if (companyInput.mode === "existing" && !companyInput.id) {
        throw new ApiError(400, "company.id is required");
    }
    if (companyInput.mode === "new" && !companyInput.name?.trim()) {
        throw new ApiError(400, "company.name is required");
    }
    if (contactInput && !["existing", "new"].includes(contactInput.mode)) {
        throw new ApiError(400, "Choose an existing contact or provide a new contact");
    }
    if (contactInput?.mode === "existing" && !contactInput.id) {
        throw new ApiError(400, "contact.id is required");
    }
    if (contactInput?.mode === "new" && !contactInput.firstName?.trim()) {
        throw new ApiError(400, "contact.firstName is required");
    }

    try {
        const lead = await prisma.$transaction(async (tx) => {
            let company;

            if (companyInput.mode === "existing") {
                company = await tx.company.findFirst({
                    where: { id: companyInput.id, organizationId: req.organizationId },
                });
                if (!company) throw new ApiError(404, "Company not found");
            } else {
                company = await tx.company.create({
                    data: {
                        name: companyInput.name.trim(),
                        email: companyInput.email || null,
                        phone: companyInput.phone || null,
                        website: companyInput.website || null,
                        organizationId: req.organizationId,
                    },
                });
            }

            let contactId = null;
            if (contactInput?.mode === "existing") {
                const contact = await tx.contact.findFirst({
                    where: {
                        id: contactInput.id,
                        companyId: company.id,
                        company: { is: { organizationId: req.organizationId } },
                    },
                    select: { id: true },
                });
                if (!contact) throw new ApiError(400, "Contact must belong to the selected company");
                contactId = contact.id;
            }
            if (contactInput?.mode === "new") {
                const contact = await tx.contact.create({
                    data: {
                        firstName: contactInput.firstName.trim(),
                        lastName: contactInput.lastName || null,
                        email: contactInput.email || null,
                        phone: contactInput.phone || null,
                        jobTitle: contactInput.jobTitle || null,
                        companyId: company.id,
                    },
                });
                contactId = contact.id;
            }

            return tx.lead.create({
                data: {
                    title: title.trim(),
                    description: description || null,
                    source,
                    companyId: company.id,
                    contactId,
                    organizationId: req.organizationId,
                    assignedToId: req.user.id,
                },
                include: leadRelations,
            });
        });

        return res.status(201).json(
            new ApiResponse(201, [], lead, "Lead created successfully")
        );
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error?.code === "P2002") throw new ApiError(409, "A company with this name already exists");
        throw error;
    }
});

export const updateSalesLeadStatus = asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!Object.values(LeadStatus).includes(status) || status === LeadStatus.CONVERTED) {
        throw new ApiError(400, "Invalid lead status");
    }

    const lead = await prisma.lead.findFirst({
        where: { id: req.params.leadId, organizationId: req.organizationId },
        select: { id: true, status: true },
    });
    if (!lead) throw new ApiError(404, "Lead not found");
    if (lead.status === LeadStatus.CONVERTED) throw new ApiError(409, "Converted leads cannot change status");

    const updatedLead = await prisma.lead.update({
        where: { id: lead.id, organizationId: req.organizationId },
        data: { status },
        include: leadRelations,
    });

    return res.status(200).json(
        new ApiResponse(200, [], updatedLead, "Lead status updated successfully")
    );
});

export const deleteSalesLead = asyncHandler(async (req, res) => {
    const lead = await prisma.lead.findFirst({
        where: { id: req.params.leadId, organizationId: req.organizationId },
        select: { id: true },
    });
    if (!lead) throw new ApiError(404, "Lead not found");

    const [tasks, activities] = await Promise.all([
        prisma.task.count({ where: { leadId: lead.id, organizationId: req.organizationId } }),
        prisma.activity.count({ where: { leadId: lead.id, organizationId: req.organizationId } }),
    ]);
    if (tasks || activities) throw new ApiError(409, "Delete related tasks and activities before deleting this lead");

    try {
        await prisma.lead.delete({
            where: { id: lead.id, organizationId: req.organizationId },
        });
    } catch (error) {
        if (error?.code === "P2003") throw new ApiError(409, "This lead has related records and cannot be deleted");
        throw error;
    }

    return res.status(200).json(
        new ApiResponse(200, [], { leadId: lead.id }, "Lead deleted successfully")
    );
});

export const convertSalesLead = asyncHandler(async (req, res) => {
    const result = await prisma.$transaction(async (tx) => {
        const lead = await tx.lead.findFirst({
            where: { id: req.params.leadId, organizationId: req.organizationId },
            select: { id: true, status: true, companyId: true, customerId: true, assignedToId: true },
        });
        if (!lead) throw new ApiError(404, "Lead not found");
        if (!lead.companyId) throw new ApiError(400, "Associate a company before converting this lead");

        const company = await tx.company.findFirst({
            where: { id: lead.companyId, organizationId: req.organizationId },
            select: { id: true },
        });
        if (!company) throw new ApiError(409, "Lead company was not found in this organization");

        if (lead.status === LeadStatus.CONVERTED) {
            if (!lead.customerId) throw new ApiError(409, "Lead conversion data is inconsistent");
            const customer = await tx.customer.findFirst({
                where: {
                    id: lead.customerId,
                    companyId: company.id,
                    organizationId: req.organizationId,
                },
                select: { id: true, companyId: true },
            });
            if (!customer) throw new ApiError(409, "Lead conversion data is inconsistent");
            return { lead: { id: lead.id, status: lead.status }, customer };
        }
        if (lead.status === LeadStatus.UNQUALIFIED || lead.customerId) {
            throw new ApiError(409, "This lead cannot be converted in its current state");
        }

        const customer = await tx.customer.upsert({
            where: {
                organizationId_companyId: {
                    organizationId: req.organizationId,
                    companyId: company.id,
                },
            },
            create: {
                organizationId: req.organizationId,
                companyId: company.id,
                assignedToId: lead.assignedToId,
            },
            update: {},
            select: { id: true, companyId: true },
        });
        await tx.lead.update({
            where: { id: lead.id, organizationId: req.organizationId },
            data: {
                status: LeadStatus.CONVERTED,
                convertedAt: new Date(),
                convertedById: req.user.id,
                customerId: customer.id,
            },
        });

        return { lead: { id: lead.id, status: LeadStatus.CONVERTED }, customer };
    });

    return res.status(200).json(
        new ApiResponse(200, [], result, "Lead converted successfully")
    );
});
