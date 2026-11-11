import prisma from "../../db/index.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getSalesProfile = asyncHandler(async (req, res) => {
    const user = await prisma.user.findFirst({
        where: { id: req.user.id, organizationId: req.organizationId },
        select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            organization: {
                select: { name: true, email: true, phone: true, website: true },
            },
            teamMemberships: {
                where: { team: { organizationId: req.organizationId } },
                select: { team: { select: { name: true } } },
            },
        },
    });
    if (!user) throw new ApiError(404, "Profile not found");

    const profile = {
        firstName: user.firstName,
        lastName: user.lastName || "",
        email: user.email,
        phone: user.phone || "",
        role: user.role === "SALES" ? "Sales Executive" : user.role,
        accountStatus: user.status,
        accountCreated: user.createdAt,
        lastUpdated: user.updatedAt,
        organizationName: user.organization?.name || "",
        organizationEmail: user.organization?.email || "",
        organizationPhone: user.organization?.phone || "",
        organizationWebsite: user.organization?.website || "",
        team: user.teamMemberships.map((membership) => membership.team.name).join(", ") || "Not assigned",
    };

    return res.status(200).json(
        new ApiResponse(200, [], profile, "Profile retrieved successfully")
    );
});

export const updateSalesProfile = asyncHandler(async (req, res) => {
    const user = await prisma.user.findFirst({
        where: { id: req.user.id, organizationId: req.organizationId },
        select: { id: true },
    });
    if (!user) throw new ApiError(404, "Profile not found");

    const { firstName, lastName, phone } = req.body || {};
    const data = {};
    if (firstName !== undefined) {
        if (typeof firstName !== "string" || !firstName.trim()) throw new ApiError(400, "First name is required");
        data.firstName = firstName.trim();
    }
    if (lastName !== undefined) {
        if (typeof lastName !== "string") throw new ApiError(400, "Invalid last name");
        data.lastName = lastName.trim() || null;
    }
    if (phone !== undefined) {
        if (typeof phone !== "string") throw new ApiError(400, "Invalid phone number");
        data.phone = phone.trim() || null;
    }
    if (!Object.keys(data).length) throw new ApiError(400, "No profile changes provided");

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data,
        select: { firstName: true, lastName: true, phone: true, updatedAt: true },
    });

    return res.status(200).json(
        new ApiResponse(200, [], updatedUser, "Profile updated successfully")
    );
});

