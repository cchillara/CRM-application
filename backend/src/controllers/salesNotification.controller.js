import prisma from "../db/index.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSalesNotifications = asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
        where: { organizationId: req.organizationId, userId: req.user.id },
        orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(
        new ApiResponse(200, [], notifications, "Notifications retrieved successfully")
    );
});

export const getSalesUnreadNotificationCount = asyncHandler(async (req, res) => {
    const count = await prisma.notification.count({
        where: { organizationId: req.organizationId, userId: req.user.id, isRead: false },
    });

    return res.status(200).json(
        new ApiResponse(200, [], { count }, "Unread notification count retrieved successfully")
    );
});

export const markSalesNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findFirst({
        where: {
            id: req.params.notificationId,
            organizationId: req.organizationId,
            userId: req.user.id,
        },
        select: { id: true },
    });
    if (!notification) throw new ApiError(404, "Notification not found");

    const updatedNotification = await prisma.notification.update({
        where: { id: notification.id },
        data: { isRead: true },
    });

    return res.status(200).json(
        new ApiResponse(200, [], updatedNotification, "Notification marked as read successfully")
    );
});

export const markAllSalesNotificationsAsRead = asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
        where: { organizationId: req.organizationId, userId: req.user.id, isRead: false },
        data: { isRead: true },
    });

    return res.status(200).json(
        new ApiResponse(200, [], { count: result.count }, "Notifications marked as read successfully")
    );
});
