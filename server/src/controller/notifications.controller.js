
import asyncHandler from "express-async-handler";

import {
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from "../services/notification.service.js";

// GET - Fetch user notifications
export const getNotificationsController = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const result = await getUserNotifications({
        userId: req.user._id,
        page,
        limit
    });

    res.status(200).json({
        success: true,
        ...result
    });
});

// GET - Get unread notification count
export const getUnreadCountController = asyncHandler(async (req, res) => {
    const count = await getUnreadNotificationCount(req.user._id);

    res.status(200).json({
        success: true,
        unreadCount: count
    });
});

// PATCH - Mark one notification as read
export const markNotificationAsReadController = asyncHandler(async (req, res) => {
    const notification = await markNotificationAsRead({
        notificationId: req.params.notificationId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: notification
    });
});

// PATCH - Mark all notifications as read
export const markAllNotificationsAsReadController = asyncHandler(async (req, res) => {
    const result = await markAllNotificationsAsRead(req.user._id);

    res.status(200).json({
        success: true,
        ...result
    });
});
