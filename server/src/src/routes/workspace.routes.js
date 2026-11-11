
import express from "express";

import protect from "../middlewares/auth.middleware.js";

import {
    createWorkspaceController,
    getOrganizationWorkspacesController,
    addWorkspaceMemberController,
    getWorkspaceMembersController,
    removeWorkspaceMemberController,
    updateWorkspaceMemberRoleController
} from "../controller/workspaces.controller.js";

const router = express.Router();

router.use(protect);

// Workspace creation and listing.
router.post("/", createWorkspaceController);

router.get(
    "/organization/:organizationId",
    getOrganizationWorkspacesController
);

// Workspace member management.
router.post(
    "/:workspaceId/members",
    addWorkspaceMemberController
);

router.get(
    "/:workspaceId/members",
    getWorkspaceMembersController
);

router.delete(
    "/:workspaceId/members/:userId",
    removeWorkspaceMemberController
);

router.patch(
    "/:workspaceId/members/:userId/role",
    updateWorkspaceMemberRoleController
);

export default router;
