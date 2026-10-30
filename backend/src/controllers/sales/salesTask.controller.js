import { TaskStatus } from "@prisma/client";
import prisma from "../../db/index.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const taskRelations = {
    assignedTo: {
        select: { id: true, firstName: true, lastName: true },
    },
    lead: {
        select: { id: true, title: true },
    },
    customer: {
        select: {
            id: true,
            company: { select: { name: true } },
        },
    },
    deal: {
        select: { id: true, title: true },
    },
};

export const getSalesTasks = asyncHandler(async (req, res) => {
    const tasks = await prisma.task.findMany({
        where: { organizationId: req.organizationId },
        include: taskRelations,
        orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(
        new ApiResponse(200, [], tasks, "Tasks retrieved successfully")
    );
});

export const createSalesTask = asyncHandler(async (req, res) => {
    const { title, description, dueDate, relatedType, relatedId } = req.body || {};

    if (!title?.trim()) throw new ApiError(400, "title is required");
    if ((relatedType && !relatedId) || (!relatedType && relatedId)) {
        throw new ApiError(400, "relatedType and relatedId must be provided together");
    }

    const data = {
        title: title.trim(),
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        organizationId: req.organizationId,
        assignedToId: req.user.id,
    };

    if (dueDate && Number.isNaN(data.dueDate.getTime())) {
        throw new ApiError(400, "Invalid dueDate");
    }

    if (relatedId) {
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
        } else if (relatedType === "Deal") {
            const deal = await prisma.deal.findFirst({
                where: { id: relatedId, organizationId: req.organizationId },
                select: { id: true },
            });
            if (!deal) throw new ApiError(404, "Deal not found");
            data.dealId = deal.id;
        } else {
            throw new ApiError(400, "Invalid relatedType");
        }
    }

    const task = await prisma.task.create({
        data,
        include: taskRelations,
    });

    return res.status(201).json(
        new ApiResponse(201, [], task, "Task created successfully")
    );
});

export const updateSalesTaskStatus = asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!Object.values(TaskStatus).includes(status)) {
        throw new ApiError(400, "Invalid task status");
    }

    const task = await prisma.task.findFirst({
        where: { id: req.params.taskId, organizationId: req.organizationId },
        select: { id: true },
    });
    if (!task) throw new ApiError(404, "Task not found");

    const updatedTask = await prisma.task.update({
        where: { id: task.id, organizationId: req.organizationId },
        data: { status },
        include: taskRelations,
    });

    return res.status(200).json(
        new ApiResponse(200, [], updatedTask, "Task status updated successfully")
    );
});

export const deleteSalesTask = asyncHandler(async (req, res) => {
    const task = await prisma.task.findFirst({
        where: { id: req.params.taskId, organizationId: req.organizationId },
        select: { id: true },
    });
    if (!task) throw new ApiError(404, "Task not found");

    await prisma.task.delete({
        where: { id: task.id, organizationId: req.organizationId },
    });

    return res.status(200).json(
        new ApiResponse(200, [], { taskId: task.id }, "Task deleted successfully")
    );
});
