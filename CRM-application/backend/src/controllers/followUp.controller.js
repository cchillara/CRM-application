import prisma from "../db/index.js";
import { ActivityType } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function parseFollowUpDescription(raw) {
    if (!raw) return { text: "", nextFollowUpDate: null, author: null, entityType: null, entityId: null };
    try {
        if (typeof raw === "string" && (raw.startsWith("{") || raw.startsWith("["))) {
            const parsed = JSON.parse(raw);
            if (typeof parsed === "object" && parsed !== null) {
                return {
                    text: parsed.text || parsed.description || "",
                    nextFollowUpDate: parsed.nextFollowUpDate || null,
                    author: parsed.author || null,
                    entityType: parsed.entityType || null,
                    entityId: parsed.entityId || null,
                };
            }
        }
    } catch (_) { }
    return { text: raw, nextFollowUpDate: null, author: null, entityType: null, entityId: null };
}

export function formatDateDisplay(dateVal) {
    if (!dateVal) return "Today";
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

export const getFollowUps = asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.query || {};

    const activities = await prisma.activity.findMany({
        where: {
            type: ActivityType.FOLLOW_UP,
        },
        orderBy: { createdAt: "desc" },
    });

    const targetType = entityType ? String(entityType).toLowerCase().trim() : null;
    const targetId = entityId ? String(entityId).trim() : null;

    const matched = activities.filter((act) => {
        const meta = parseFollowUpDescription(act.description);
        if (targetType && targetId) {
            if (meta.entityType && meta.entityId) {
                return String(meta.entityType).toLowerCase() === targetType && String(meta.entityId) === targetId;
            }
            if (targetType === "lead" && act.leadId === targetId) return true;
            if (targetType === "customer" && act.customerId === targetId) return true;
            return false;
        }
        return true;
    });

    const results = matched.map((act) => {
        const meta = parseFollowUpDescription(act.description);
        return {
            id: act.id,
            entityType: meta.entityType || (act.leadId ? "lead" : act.customerId ? "customer" : "general"),
            entityId: meta.entityId || act.leadId || act.customerId || "",
            description: meta.text || act.description,
            nextFollowUpDate: meta.nextFollowUpDate || null,
            author: meta.author || "Team Member",
            createdAt: formatDateDisplay(act.createdAt),
            rawCreatedAt: act.createdAt,
        };
    });

    return res.status(200).json(
        new ApiResponse(200, [], results, "Follow-ups retrieved successfully")
    );
});

export const createFollowUp = asyncHandler(async (req, res) => {
    const { entityType, entityId, description, nextFollowUpDate, author } = req.body || {};

    if (!description?.trim()) {
        throw new ApiError(400, "Description is required for follow-up note");
    }

    const normType = entityType ? String(entityType).toLowerCase().trim() : "general";
    const normId = entityId ? String(entityId).trim() : null;

    // Resolve or find a default organization
    let orgId = req.organizationId;
    if (!orgId) {
        const firstOrg = await prisma.organization.findFirst({ select: { id: true } });
        orgId = firstOrg?.id || "default";
    }

    // Resolve or find performedBy user
    let userId = req.user?.id;
    if (!userId) {
        const firstUser = await prisma.user.findFirst({ select: { id: true } });
        userId = firstUser?.id;
    }

    const payloadMeta = {
        text: description.trim(),
        nextFollowUpDate: nextFollowUpDate || null,
        author: author || req.user?.firstName || "Team Member",
        entityType: normType,
        entityId: normId,
    };

    const data = {
        type: ActivityType.FOLLOW_UP,
        description: JSON.stringify(payloadMeta),
        organizationId: orgId,
        performedById: userId,
    };

    if (normType === "lead" && normId) {
        const lead = await prisma.lead.findFirst({ where: { id: normId }, select: { id: true } });
        if (lead) data.leadId = lead.id;
    } else if (normType === "customer" && normId) {
        const customer = await prisma.customer.findFirst({ where: { id: normId }, select: { id: true } });
        if (customer) data.customerId = customer.id;
    }

    const activity = await prisma.activity.create({ data });

    const formatted = {
        id: activity.id,
        entityType: normType,
        entityId: normId,
        description: payloadMeta.text,
        nextFollowUpDate: payloadMeta.nextFollowUpDate,
        author: payloadMeta.author,
        createdAt: formatDateDisplay(activity.createdAt),
        rawCreatedAt: activity.createdAt,
    };

    return res.status(201).json(
        new ApiResponse(201, [], formatted, "Follow-up created successfully")
    );
});

export const updateFollowUp = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { description, nextFollowUpDate, author } = req.body || {};

    const activity = await prisma.activity.findFirst({
        where: { id },
    });
    if (!activity) throw new ApiError(404, "Follow-up note not found");

    const existingMeta = parseFollowUpDescription(activity.description);
    const updatedMeta = {
        ...existingMeta,
        text: description !== undefined ? description.trim() : existingMeta.text,
        nextFollowUpDate: nextFollowUpDate !== undefined ? nextFollowUpDate : existingMeta.nextFollowUpDate,
        author: author !== undefined ? author : existingMeta.author,
    };

    const updatedActivity = await prisma.activity.update({
        where: { id: activity.id },
        data: {
            description: JSON.stringify(updatedMeta),
        },
    });

    const formatted = {
        id: updatedActivity.id,
        entityType: updatedMeta.entityType,
        entityId: updatedMeta.entityId,
        description: updatedMeta.text,
        nextFollowUpDate: updatedMeta.nextFollowUpDate,
        author: updatedMeta.author,
        createdAt: formatDateDisplay(updatedActivity.createdAt),
    };

    return res.status(200).json(
        new ApiResponse(200, [], formatted, "Follow-up updated successfully")
    );
});

export const deleteFollowUp = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const activity = await prisma.activity.findFirst({
        where: { id },
        select: { id: true },
    });
    if (!activity) throw new ApiError(404, "Follow-up note not found");

    await prisma.activity.delete({
        where: { id: activity.id },
    });

    return res.status(200).json(
        new ApiResponse(200, [], { id: activity.id }, "Follow-up deleted successfully")
    );
});

