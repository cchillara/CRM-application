import prisma from "../../db/index.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ActivityType } from "../../generated/prisma/client.ts";
import { ApiError } from "../../utils/apiError.js";

export const getAllNotes = asyncHandler(async (req, res) => {
    const activities = await prisma.activity.findMany({
        where: {
            organizationId: req.organizationId,
            type: ActivityType.NOTE,
        },
        orderBy: { updatedAt: "desc" },
    });

    const leadIds = activities.map((note) => note.leadId).filter(Boolean);
    const customerIds = activities.map((note) => note.customerId).filter(Boolean);

    const [leads, customers] = await Promise.all([
        prisma.lead.findMany({
            where: { id: { in: leadIds }, organizationId: req.organizationId },
            select: {
                id: true,
                title: true,
                contact: { select: { firstName: true, lastName: true } },
            },
        }),
        prisma.customer.findMany({
            where: { id: { in: customerIds }, organizationId: req.organizationId },
            select: {
                id: true,
                company: { select: { name: true } },
            },
        }),
    ]);

    const leadById = new Map(leads.map((lead) => [lead.id, lead]));
    const customerById = new Map(customers.map((customer) => [customer.id, customer]));

    const notes = activities.map((activity) => {
        const [firstLine, ...contentLines] = activity.description.split("\n");
        const hasTitle = contentLines.length > 0;
        const lead = activity.leadId ? leadById.get(activity.leadId) : null;
        const customer = activity.customerId ? customerById.get(activity.customerId) : null;
        let relatedTo = null;

        if (lead) {
            relatedTo = {
                type: "Lead",
                id: lead.id,
                name: [lead.contact?.firstName, lead.contact?.lastName].filter(Boolean).join(" ") || lead.title,
            };
        } else if (customer) {
            relatedTo = {
                type: "Customer",
                id: customer.id,
                name: customer.company.name,
            };
        }

        return {
            ...activity,
            title: hasTitle ? firstLine : "Note",
            content: hasTitle ? contentLines.join("\n") : activity.description,
            relatedTo,
        };
    });

    return res.status(200).json(
        new ApiResponse(200, [], notes, "Notes retrieved successfully")
    );
});

export const createNotes = asyncHandler(async (req, res) => {
    const { title, content, relatedType, relatedId } = req.body || {};

    if (!title?.trim() || !content?.trim()) {
        throw new ApiError(400, "Title and content are required");
    }
    if ((relatedType && !relatedId) || (!relatedType && relatedId)) {
        throw new ApiError(400, "relatedType and relatedId must be provided together");
    }

    const data = {
        type: ActivityType.NOTE,
        description: `${title.trim()}\n${content.trim()}`,
        organizationId: req.organizationId,
        performedById: req.user.id,
    };

    if (relatedType === "Lead") {
        const lead = await prisma.lead.findFirst({
            where: { id: relatedId, organizationId: req.organizationId },
            select: {
                id: true,
                title: true,
                contact: { select: { firstName: true, lastName: true } },
            },
        });
        if (!lead) throw new ApiError(404, "Lead not found");
        data.leadId = lead.id;
    } 
        else if (relatedType === "Customer") {
        const customer = await prisma.customer.findFirst({
            where: { id: relatedId, organizationId: req.organizationId },
            select: {
                id: true,
                company: { select: { name: true } },
            },
        });
        if (!customer) throw new ApiError(404, "Customer not found");
        data.customerId = customer.id;
    } else if (relatedType) {
        throw new ApiError(400, "relatedType must be Lead or Customer");
    }

    const activity = await prisma.activity.create({
        data,
        include: {
            lead: {
                select: {
                    id: true,
                    title: true,
                    contact: { select: { firstName: true, lastName: true } },
                },
            },
            customer: {
                select: {
                    id: true,
                    company: { select: { name: true } },
                },
            },
        },
    });

    let relatedTo = null;
    if (activity.lead) {
        relatedTo = {
            type: "Lead",
            id: activity.lead.id,
            name: [activity.lead.contact?.firstName, activity.lead.contact?.lastName].filter(Boolean).join(" ") || activity.lead.title,
        };
    } else if (activity.customer) {
        relatedTo = {
            type: "Customer",
            id: activity.customer.id,
            name: activity.customer.company.name,
        };
    }

    const note = {
        ...activity,
        title: title.trim(),
        content: content.trim(),
        relatedTo,
    };

    return res.status(201).json(
        new ApiResponse(201, [], note, "Note created successfully")
    );
});

export const editNotes = asyncHandler(async (req, res) => {
    const { title, content, relatedType, relatedId } = req.body || {};

    if (!title?.trim() || !content?.trim()) {
        throw new ApiError(400, "Title and content are required");
    }
    if ((relatedType && !relatedId) || (!relatedType && relatedId)) {
        throw new ApiError(400, "relatedType and relatedId must be provided together");
    }

    const existingNote = await prisma.activity.findFirst({
        where: {
            id: req.params.noteId,
            organizationId: req.organizationId,
            type: ActivityType.NOTE,
        },
        select: { id: true },
    });
    if (!existingNote) throw new ApiError(404, "Note not found");

    const data = {
        description: `${title.trim()}\n${content.trim()}`,
        leadId: null,
        customerId: null,
    };

    if (relatedType === "Lead") {
        const lead = await prisma.lead.findFirst({
            where: { id: relatedId, organizationId: req.organizationId },
            select: { id: true },
        });
        if (!lead) throw new ApiError(404, "Lead not found");
        data.leadId = lead.id;
    } else if (relatedType === "Customer") {
        const customer = await prisma.customer.findFirst({
            where: { id: relatedId, organizationId: req.organizationId },
            select: { id: true },
        });
        if (!customer) throw new ApiError(404, "Customer not found");
        data.customerId = customer.id;
    } else if (relatedType) {
        throw new ApiError(400, "relatedType must be Lead or Customer");
    }

    const activity = await prisma.activity.update({
        where: { id: existingNote.id, organizationId: req.organizationId },
        data,
        include: {
            lead: {
                select: {
                    id: true,
                    title: true,
                    contact: { select: { firstName: true, lastName: true } },
                },
            },
            customer: {
                select: {
                    id: true,
                    company: { select: { name: true } },
                },
            },
        },
    });

    let relatedTo = null;
    if (activity.lead) {
        relatedTo = {
            type: "Lead",
            id: activity.lead.id,
            name: [activity.lead.contact?.firstName, activity.lead.contact?.lastName].filter(Boolean).join(" ") || activity.lead.title,
        };
    } else if (activity.customer) {
        relatedTo = {
            type: "Customer",
            id: activity.customer.id,
            name: activity.customer.company.name,
        };
    }

    const note = {
        ...activity,
        title: title.trim(),
        content: content.trim(),
        relatedTo,
    };

    return res.status(200).json(
        new ApiResponse(200, [], note, "Note updated successfully")
    );
});

export const deleteNotes = asyncHandler(async (req, res) => {
    const note = await prisma.activity.findFirst({
        where: {
            id: req.params.noteId,
            organizationId: req.organizationId,
            type: ActivityType.NOTE,
        },
        select: { id: true },
    });

    if (!note) throw new ApiError(404, "Note not found");

    await prisma.activity.delete({
        where: { id: note.id, organizationId: req.organizationId },
    });

    return res.status(200).json(
        new ApiResponse(200, [], { noteId: note.id }, "Note deleted successfully")
    );
});
