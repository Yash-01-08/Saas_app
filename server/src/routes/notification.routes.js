
import express from "express";
import protect from "../middlewares/auth.middleware.js";

import {
    getNotificationsController,
    getUnreadCountController,
    markNotificationAsReadController,
    markAllNotificationsAsReadController
} from "../controller/notifications.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotificationsController);

router.get("/unread-count", getUnreadCountController);

router.patch("/read-all", markAllNotificationsAsReadController);

router.patch("/:notificationId/read", markNotificationAsReadController);

export default router;
