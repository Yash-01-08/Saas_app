
import createError from "http-errors";
import Notification from "../models/Notification.js";
import { notificationQueue } from "../config/queues.js";
// Create notification

export const createNotification = async ({
    recipient,
    sender = null,
    type,
    message,
    task = null,
    project = null,
    sprint = null,
    workspace = null
}) => {
    if (!recipient || !type || !message) {
        throw createError(400, "Recipient, type and message are required");
    }

    const job = await notificationQueue.add(
        "create-notification",
        {
            recipient,
            sender,
            type,
            message,
            task,
            project,
            sprint,
            workspace
        }
    );

    return job;
};

// Get notifications for a user
export const getUserNotifications = async ({
    userId,
    page = 1,
    limit = 20
}) => {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
        Notification.find({ recipient: userId })
            .populate("sender", "name username")
            .populate("task", "title")
            .populate("project", "name")
            .populate("sprint", "name")
            .populate("workspace", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        Notification.countDocuments({ recipient: userId })
    ]);

    return {
        notifications,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId) => {
    return Notification.countDocuments({
        recipient: userId,
        isRead: false
    });
};

// Mark one notification as read
export const markNotificationAsRead = async ({
    notificationId,
    userId
}) => {
    const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
    });

    if (!notification) {
        throw createError(404, "Notification not found");
    }

    if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date();

        await notification.save();
    }

    return notification;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
    await Notification.updateMany(
        {
            recipient: userId,
            isRead: false
        },
        {
            $set: {
                isRead: true,
                readAt: new Date()
            }
        }
    );

    return {
        message: "All notifications marked as read"
    };
};
