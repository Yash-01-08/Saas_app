import express from "express";

import protect from "../middlewares/auth.middleware.js";

import {
    createOrganizationController,
    joinOrganizationController,
    getMyOrganizationsController,
    regenerateInviteCodeController,
    updateInviteStatusController
} from "../controller/organizations.controller.js";

const router = express.Router();

// All organization routes require authentication.
router.use(protect);

router.post("/", createOrganizationController);
router.post("/join", joinOrganizationController);
router.get("/my", getMyOrganizationsController);

router.patch(
    "/:organizationId/invite-code",
    regenerateInviteCodeController
);

router.patch(
    "/:organizationId/invite-status",
    updateInviteStatusController
);

export default router;