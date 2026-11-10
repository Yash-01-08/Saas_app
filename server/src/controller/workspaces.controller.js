
import asyncHandler from "express-async-handler";
import createError from "http-errors";

import {
    createWorkspace,
    getOrganizationWorkspaces,
    addWorkspaceMember,
    getWorkspaceMembers,
    removeWorkspaceMember,
    updateWorkspaceMemberRole
} from "../services/workspace.service.js";

const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Create workspace.
export const createWorkspaceController = asyncHandler(async (req, res) => {
    const { name, description, organizationId } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
        throw createError(400, "Workspace name is required");
    }

    if (!organizationId || !isValidId(organizationId)) {
        throw createError(400, "A valid organization ID is required");
    }

    if (description !== undefined && typeof description !== "string") {
        throw createError(400, "Description must be a string");
    }

    const workspace = await createWorkspace({
        name: name.trim(),
        description: description || "",
        organizationId,
        userId: req.user._id
    });

    res.status(201).json({
        success: true,
        message: "Workspace created successfully",
        workspace
    });
});

// Get workspaces belonging to an organization that the user can access.
export const getOrganizationWorkspacesController = asyncHandler(
    async (req, res) => {
        const { organizationId } = req.params;

        if (!isValidId(organizationId)) {
            throw createError(400, "Invalid organization ID");
        }

        const workspaces = await getOrganizationWorkspaces({
            organizationId,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            count: workspaces.length,
            workspaces
        });
    }
);

// Add an organization member to a workspace.
export const addWorkspaceMemberController = asyncHandler(
    async (req, res) => {
        const { workspaceId } = req.params;
        const { userId: targetUserId, role } = req.body;

        if (!isValidId(workspaceId)) {
            throw createError(400, "Invalid workspace ID");
        }

        if (!targetUserId || !isValidId(targetUserId)) {
            throw createError(400, "A valid user ID is required");
        }

        if (role !== undefined && !["admin", "member", "viewer"].includes(role)) {
            throw createError(400, "Invalid workspace role");
        }

        const member = await addWorkspaceMember({
            workspaceId,
            targetUserId,
            userId: req.user._id,
            role: role || "member"
        });

        res.status(201).json({
            success: true,
            message: "Member added to workspace successfully",
            member
        });
    }
);

// List workspace members.
export const getWorkspaceMembersController = asyncHandler(
    async (req, res) => {
        const { workspaceId } = req.params;

        if (!isValidId(workspaceId)) {
            throw createError(400, "Invalid workspace ID");
        }

        const members = await getWorkspaceMembers({
            workspaceId,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            count: members.length,
            members
        });
    }
);

// Remove a member from a workspace.
export const removeWorkspaceMemberController = asyncHandler(
    async (req, res) => {
        const { workspaceId, userId: targetUserId } = req.params;

        if (!isValidId(workspaceId) || !isValidId(targetUserId)) {
            throw createError(400, "Invalid workspace ID or user ID");
        }

        await removeWorkspaceMember({
            workspaceId,
            targetUserId,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: "Member removed from workspace successfully"
        });
    }
);

// Update a workspace member's role.
export const updateWorkspaceMemberRoleController = asyncHandler(
    async (req, res) => {
        const { workspaceId, userId: targetUserId } = req.params;
        const { role } = req.body;

        if (!isValidId(workspaceId) || !isValidId(targetUserId)) {
            throw createError(400, "Invalid workspace ID or user ID");
        }

        if (!role || !["admin", "member", "viewer"].includes(role)) {
            throw createError(400, "A valid workspace role is required");
        }

        const member = await updateWorkspaceMemberRole({
            workspaceId,
            targetUserId,
            userId: req.user._id,
            role
        });

        res.status(200).json({
            success: true,
            message: "Workspace member role updated successfully",
            member
        });
    }
);
