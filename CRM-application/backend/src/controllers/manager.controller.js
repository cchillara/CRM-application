import { DealStage, TaskStatus } from "@prisma/client";
import prisma from "../db/index.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getManagerTeam = async (req) => {
    const memberships = await prisma.teamMembership.findMany({
        where: {
            userId: req.user.id,
            team: { organizationId: req.organizationId },
        },
        select: { teamId: true },
    });
    const teamIds = [...new Set(memberships.map((membership) => membership.teamId))];
    const members = teamIds.length
        ? await prisma.teamMembership.findMany({
            where: {
                teamId: { in: teamIds },
                team: { organizationId: req.organizationId },
                user: { organizationId: req.organizationId },
            },
            select: { userId: true },
        })
        : [];
    return {
        teamIds,
        memberIds: [...new Set([req.user.id, ...members.map((member) => member.userId)])],
    };
};

export const getManagerTeams = asyncHandler(async (req, res) => {
    const teams = await prisma.team.findMany({
        where: {
            organizationId: req.organizationId,
            members: { some: { userId: req.user.id } },
        },
        include: {
            members: {
                where: { user: { organizationId: req.organizationId } },
                select: {
                    createdAt: true,
                    user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true } },
                },
            },
        },
        orderBy: { name: "asc" },
    });
    return res.status(200).json(new ApiResponse(200, [], teams, "Manager teams retrieved successfully"));
});

export const getManagerTeamMembers = asyncHandler(async (req, res) => {
    const { memberIds } = await getManagerTeam(req);
    const members = await prisma.user.findMany({
        where: { id: { in: memberIds }, organizationId: req.organizationId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            teamMemberships: {
                where: { team: { organizationId: req.organizationId } },
                select: { team: { select: { id: true, name: true } } },
            },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    return res.status(200).json(new ApiResponse(200, [], members, "Team members retrieved successfully"));
});

export const getManagerDashboard = asyncHandler(async (req, res) => {
    const { teamIds, memberIds } = await getManagerTeam(req);
    const organizationId = req.organizationId;
    const [leads, customers, tasks, openTasks, deals, activities, recentActivities] = await Promise.all([
        prisma.lead.count({ where: { organizationId, assignedToId: { in: memberIds } } }),
        prisma.customer.count({ where: { organizationId, assignedToId: { in: memberIds } } }),
        prisma.task.count({ where: { organizationId, assignedToId: { in: memberIds } } }),
        prisma.task.count({
            where: {
                organizationId,
                assignedToId: { in: memberIds },
                status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
            },
        }),
        prisma.deal.count({ where: { organizationId, assignedToId: { in: memberIds } } }),
        prisma.activity.count({ where: { organizationId, performedById: { in: memberIds } } }),
        prisma.activity.findMany({
            where: { organizationId, performedById: { in: memberIds } },
            include: { performedBy: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: "desc" },
            take: 10,
        }),
    ]);
    return res.status(200).json(new ApiResponse(200, [], {
        teamCount: teamIds.length,
        teamSize: Math.max(memberIds.length - 1, 0),
        leads,
        customers,
        tasks,
        openTasks,
        deals,
        activities,
        recentActivities,
    }, "Manager dashboard retrieved successfully"));
});

export const getManagerActivities = asyncHandler(async (req, res) => {
    const { memberIds } = await getManagerTeam(req);
    const activities = await prisma.activity.findMany({
        where: { organizationId: req.organizationId, performedById: { in: memberIds } },
        include: {
            performedBy: { select: { id: true, firstName: true, lastName: true } },
            lead: { select: { id: true, title: true } },
            customer: { select: { id: true, company: { select: { name: true } } } },
            deal: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(new ApiResponse(200, [], activities, "Team activities retrieved successfully"));
});

export const getManagerAnalytics = asyncHandler(async (req, res) => {
    const periodDays = { "7d": 7, "30d": 30, "90d": 90 };
    const period = req.query.period || "30d";
    const days = periodDays[period];
    if (!days) throw new ApiError(400, "period must be one of: 7d, 30d, 90d");
    const { memberIds } = await getManagerTeam(req);
    const endDate = new Date();
    const startDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate() - days + 1));
    const organizationId = req.organizationId;
    const [members, leads, customers, tasks, activities, deals] = await Promise.all([
        prisma.user.findMany({
            where: { id: { in: memberIds }, organizationId },
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
        }),
        prisma.lead.groupBy({
            by: ["assignedToId", "status"],
            where: { organizationId, assignedToId: { in: memberIds }, createdAt: { gte: startDate, lte: endDate } },
            _count: { _all: true },
        }),
        prisma.customer.groupBy({
            by: ["assignedToId"],
            where: { organizationId, assignedToId: { in: memberIds }, createdAt: { gte: startDate, lte: endDate } },
            _count: { _all: true },
        }),
        prisma.task.groupBy({
            by: ["assignedToId", "status"],
            where: { organizationId, assignedToId: { in: memberIds }, createdAt: { gte: startDate, lte: endDate } },
            _count: { _all: true },
        }),
        prisma.activity.groupBy({
            by: ["performedById"],
            where: { organizationId, performedById: { in: memberIds }, createdAt: { gte: startDate, lte: endDate } },
            _count: { _all: true },
        }),
        prisma.deal.groupBy({
            by: ["assignedToId", "stage"],
            where: { organizationId, assignedToId: { in: memberIds }, stage: { in: [DealStage.WON, DealStage.LOST] } },
            _count: { _all: true },
        }),
    ]);
    const performance = members.map((member) => {
        const memberLeads = leads.filter((item) => item.assignedToId === member.id);
        const createdLeads = memberLeads.reduce((count, item) => count + item._count._all, 0);
        const convertedLeads = memberLeads.find((item) => item.status === "CONVERTED")?._count._all || 0;
        const memberTasks = tasks.filter((item) => item.assignedToId === member.id);
        const won = deals.filter((item) => item.assignedToId === member.id && item.stage === DealStage.WON).reduce((count, item) => count + item._count._all, 0);
        const lost = deals.filter((item) => item.assignedToId === member.id && item.stage === DealStage.LOST).reduce((count, item) => count + item._count._all, 0);
        return {
            ...member,
            leadsCreated: createdLeads,
            leadsConverted: convertedLeads,
            leadConversionRate: createdLeads ? Math.round((convertedLeads / createdLeads) * 100) : null,
            customersCreated: customers.find((item) => item.assignedToId === member.id)?._count._all || 0,
            tasksCreated: memberTasks.reduce((count, item) => count + item._count._all, 0),
            tasksCompleted: memberTasks.find((item) => item.status === TaskStatus.COMPLETED)?._count._all || 0,
            activities: activities.find((item) => item.performedById === member.id)?._count._all || 0,
            dealsWon: won,
            dealsLost: lost,
            dealWinRate: won + lost ? Math.round((won / (won + lost)) * 100) : null,
        };
    });
    return res.status(200).json(new ApiResponse(200, [], {
        period: { key: period, startDate, endDate },
        performance,
    }, "Manager performance report retrieved successfully"));
});

export const getManagerReport = getManagerAnalytics;
