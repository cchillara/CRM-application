import { CalendarEventType } from "../generated/prisma/client.ts";
import prisma from "../db/index.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const eventTypes = {
    Call: CalendarEventType.CALL,
    Meeting: CalendarEventType.MEETING,
    "Follow-up": CalendarEventType.FOLLOW_UP,
    Task: CalendarEventType.TASK,
};

const formatEvent = (task) => ({
    id: task.id,
    title: task.title,
    type: Object.keys(eventTypes).find((type) => eventTypes[type] === task.eventType),
    start: task.dueDate?.toISOString().slice(11, 19) === "00:00:00"
        ? task.dueDate.toISOString().slice(0, 10)
        : task.dueDate?.toISOString() || null,
    end: task.endDate?.toISOString() || null,
    relatedTo: task.leadId || task.customerId || "",
    notes: task.description || "",
});

export const getSalesCalendarEvents = asyncHandler(async (req, res) => {
    const where = { organizationId: req.organizationId, dueDate: { not: null } };
    if (req.query.start && req.query.end) {
        where.dueDate = { gte: new Date(req.query.start), lt: new Date(req.query.end) };
    }

    const tasks = await prisma.task.findMany({
        where,
        orderBy: { dueDate: "asc" },
    });

    return res.status(200).json(
        new ApiResponse(200, [], tasks.map(formatEvent), "Calendar events retrieved successfully")
    );
});

export const getSalesCalendarEventById = asyncHandler(async (req, res) => {
    const task = await prisma.task.findFirst({
        where: { id: req.params.taskId, organizationId: req.organizationId },
    });
    if (!task) throw new ApiError(404, "Calendar event not found");

    return res.status(200).json(
        new ApiResponse(200, [], formatEvent(task), "Calendar event retrieved successfully")
    );
});

export const createSalesCalendarEvent = asyncHandler(async (req, res) => {
    const { title, type, start, end, relatedTo, notes } = req.body || {};

    if (typeof title !== "string" || !title.trim()) throw new ApiError(400, "title is required");
    if (!Object.hasOwn(eventTypes, type)) throw new ApiError(400, "Invalid event type");
    if (!start) throw new ApiError(400, "start is required");
    if (notes != null && typeof notes !== "string") throw new ApiError(400, "Invalid notes");
    if (relatedTo != null && typeof relatedTo !== "string") throw new ApiError(400, "Invalid related record");

    const data = {
        title: title.trim(),
        description: notes || null,
        dueDate: new Date(start),
        endDate: end ? new Date(end) : null,
        eventType: eventTypes[type],
        organizationId: req.organizationId,
        assignedToId: req.user.id,
    };
    if (Number.isNaN(data.dueDate.getTime()) || (data.endDate && Number.isNaN(data.endDate.getTime()))) {
        throw new ApiError(400, "Invalid start or end date");
    }

    if (relatedTo) {
        const lead = await prisma.lead.findFirst({
            where: { id: relatedTo, organizationId: req.organizationId },
            select: { id: true },
        });
        if (lead) {
            data.leadId = lead.id;
        } else {
            const customer = await prisma.customer.findFirst({
                where: { id: relatedTo, organizationId: req.organizationId },
                select: { id: true },
            });
            if (!customer) throw new ApiError(404, "Related lead or customer not found");
            data.customerId = customer.id;
        }
    }

    const task = await prisma.task.create({ data });

    return res.status(201).json(
        new ApiResponse(201, [], formatEvent(task), "Calendar event created successfully")
    );
});

export const updateSalesCalendarEvent = asyncHandler(async (req, res) => {
    const task = await prisma.task.findFirst({
        where: { id: req.params.taskId, organizationId: req.organizationId },
    });
    if (!task) throw new ApiError(404, "Calendar event not found");

    const { title, type, start, end, relatedTo, notes } = req.body || {};
    const data = {};
    if (title !== undefined) {
        if (typeof title !== "string" || !title.trim()) throw new ApiError(400, "title is required");
        data.title = title.trim();
    }
    if (type !== undefined) {
        if (!Object.hasOwn(eventTypes, type)) throw new ApiError(400, "Invalid event type");
        data.eventType = eventTypes[type];
    }
    if (start !== undefined) {
        data.dueDate = new Date(start);
        if (Number.isNaN(data.dueDate.getTime())) throw new ApiError(400, "Invalid start date");
    }
    if (end !== undefined) {
        data.endDate = end ? new Date(end) : null;
        if (data.endDate && Number.isNaN(data.endDate.getTime())) throw new ApiError(400, "Invalid end date");
    }
    if (notes !== undefined) {
        if (notes != null && typeof notes !== "string") throw new ApiError(400, "Invalid notes");
        data.description = notes || null;
    }
    if (relatedTo !== undefined) {
        if (relatedTo != null && typeof relatedTo !== "string") throw new ApiError(400, "Invalid related record");
        data.leadId = null;
        data.customerId = null;
        if (relatedTo) {
            const lead = await prisma.lead.findFirst({
                where: { id: relatedTo, organizationId: req.organizationId },
                select: { id: true },
            });
            if (lead) {
                data.leadId = lead.id;
            } else {
                const customer = await prisma.customer.findFirst({
                    where: { id: relatedTo, organizationId: req.organizationId },
                    select: { id: true },
                });
                if (!customer) throw new ApiError(404, "Related lead or customer not found");
                data.customerId = customer.id;
            }
        }
    }

    const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data,
    });

    return res.status(200).json(
        new ApiResponse(200, [], formatEvent(updatedTask), "Calendar event updated successfully")
    );
});

export const deleteSalesCalendarEvent = asyncHandler(async (req, res) => {
    const task = await prisma.task.findFirst({
        where: { id: req.params.taskId, organizationId: req.organizationId },
        select: { id: true },
    });
    if (!task) throw new ApiError(404, "Calendar event not found");

    await prisma.task.delete({ where: { id: task.id } });

    return res.status(200).json(
        new ApiResponse(200, [], { taskId: task.id }, "Calendar event deleted successfully")
    );
});
