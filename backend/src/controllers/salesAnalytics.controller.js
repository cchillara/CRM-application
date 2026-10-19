import prisma from "../db/index.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const periodDays = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
};

export const getSalesAnalytics = asyncHandler(async (req, res) => {
    const period = req.query.period || "30d";
    const days = periodDays[period];

    if (!days) throw new ApiError(400, "period must be one of: 7d, 30d, 90d");

    const endDate = new Date();
    const startDate = new Date(Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate() - days + 1
    ));

    const leads = await prisma.lead.findMany({
        where: {
            organizationId: req.organizationId,
            assignedToId: req.user.id,
            createdAt: { gte: startDate, lte: endDate },
        },
        select: { createdAt: true, convertedAt: true },
    });

  

    const trendByDate = new Map();
    for (let offset = 0; offset < days; offset += 1) {
        const date = new Date(startDate.getTime() + offset * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
        trendByDate.set(date, { date, created: 0, converted: 0 });
    }

    let converted = 0;
    for (const lead of leads) {
        const createdDate = lead.createdAt.toISOString().slice(0, 10);
        const createdBucket = trendByDate.get(createdDate);
        if (createdBucket) createdBucket.created += 1;

        if (lead.convertedAt && lead.convertedAt >= startDate && lead.convertedAt <= endDate) {
            converted += 1;
            const convertedDate = lead.convertedAt.toISOString().slice(0, 10);
            const convertedBucket = trendByDate.get(convertedDate);
            if (convertedBucket) convertedBucket.converted += 1;
        }
    }

      const activitiesCompleted = await prisma.activity.count({
        where: {
            organizationId: req.organizationId,
            performedById: req.user.id,
            createdAt: { gte: startDate, lte: endDate },
            type: { in: ["CALL", "MEETING", "EMAIL", "FOLLOW_UP"] },
        },
    });

    const overdueTasks = await prisma.task.count({
        where: {
            organizationId: req.organizationId,
            assignedToId: req.user.id,
            dueDate: { lt: endDate },
            status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
    });

    const taskStatusCounts = await prisma.task.groupBy({
        by: ["status"],
        where: {
            organizationId: req.organizationId,
            assignedToId: req.user.id,
            createdAt: { gte: startDate, lte: endDate },
        },
        _count: { _all: true },
    });

    const taskCompletion = {
        TODO: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        CANCELLED: 0,
    };
    for (const item of taskStatusCounts) {
        taskCompletion[item.status] = item._count._all;
    }

    const dealStageCounts = await prisma.deal.groupBy({
        by: ["stage"],
        where: {
            organizationId: req.organizationId,
            assignedToId: req.user.id,
            stage: { in: ["WON", "LOST"] },
        },
        _count: { _all: true },
    });

    const dealOutcomes = { won: 0, lost: 0 };
    for (const item of dealStageCounts) {
        if (item.stage === "WON") dealOutcomes.won = item._count._all;
        if (item.stage === "LOST") dealOutcomes.lost = item._count._all;
    }

    const closedDeals = dealOutcomes.won + dealOutcomes.lost;

    const created = leads.length;
    const data = {
        period: { key: period, startDate, endDate },
        overview: {
            leadConversionRate: {
                created,
                converted,
                rate: created ? Math.round((converted / created) * 100) : null,
            },
            dealWinRate: {
                ...dealOutcomes,
                closed: closedDeals,
                rate: closedDeals ? Math.round((dealOutcomes.won / closedDeals) * 100) : null,
            },
            activitiesCompleted,
            overdueTasks,
        },
        dealOutcomes,
        leadConversionTrends: [...trendByDate.values()],
        taskCompletion,
    };

    return res.status(200).json(
        new ApiResponse(200, [], data, "Sales analytics retrieved successfully")
    );
});
