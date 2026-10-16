import prisma from "../db/index.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ActivityType } from "../generated/prisma/enums.js";

export const getNotes = asyncHandler(async (req, res) => {
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
