
import mongoose from "mongoose";
import createError from "http-errors";

import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/workspaceMember.js";
import Membership from "../models/membership.js";
import { createNotification } from "./notification.service.js";

// Check whether the requester is an admin of this workspace.
const verifyWorkspaceAdmin = async (workspaceId, userId) => {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw createError(404, "Workspace not found");
    }

    // Requester must still belong to the organization.
    const organizationMembership = await Membership.findOne({
        organization: workspace.organization,
        user: userId
    });

    if (!organizationMembership) {
        throw createError(403, "You are not a member of this organization");
    }

    const workspaceMembership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId,
        role: "admin"
    });

    if (!workspaceMembership) {
        throw createError(403, "Only workspace admins can manage members");
    }

    return workspace;
};

// Check whether the requester is a member of the workspace.
const verifyWorkspaceMember = async (workspaceId, userId) => {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw createError(404, "Workspace not found");
    }

    const organizationMembership = await Membership.findOne({
        organization: workspace.organization,
        user: userId
    });

    if (!organizationMembership) {
        throw createError(403, "You are not a member of this organization");
    }

    const workspaceMembership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId
    });

    if (!workspaceMembership) {
        throw createError(403, "You do not have access to this workspace");
    }

    return workspace;
};

// Create a workspace and automatically add its creator as admin.
export const createWorkspace = async ({
    name,
    description,
    organizationId,
    userId
}) => {
    const organizationMembership = await Membership.findOne({
        organization: organizationId,
        user: userId
    });

    if (
        !organizationMembership ||
        !["owner", "admin"].includes(organizationMembership.role)
    ) {
        throw createError(403, "You are not authorized to create workspaces");
    }

    const session = await mongoose.startSession();

    let workspace;

    try {
        await session.withTransaction(async () => {
            const [newWorkspace] = await Workspace.create(
                [{
                    name,
                    description,
                    organization: organizationId,
                    createdBy: userId,
                    isDefault: false
                }],
                { session }
            );

            workspace = newWorkspace;

            await WorkspaceMember.create(
                [{
                    user: userId,
                    workspace: workspace._id,
                    role: "admin",
                    addedBy: userId
                }],
                { session }
            );
        });

        return workspace;
    } catch (error) {
        if (error.code === 11000) {
            throw createError(409, "A workspace with this name already exists");
        }

        throw error;
    } finally {
        await session.endSession();
    }
};

// List only workspaces that the user has explicitly joined.
export const getOrganizationWorkspaces = async ({
    organizationId,
    userId
}) => {
    const organizationMembership = await Membership.findOne({
        organization: organizationId,
        user: userId
    });

    if (!organizationMembership) {
        throw createError(403, "You are not a member of this organization");
    }

    const workspaceMemberships = await WorkspaceMember.find({
        user: userId
    }).populate({
        path: "workspace",
        match: { organization: organizationId }
    });

    return workspaceMemberships
        .filter((membership) => membership.workspace !== null)
        .map((membership) => ({
            ...membership.workspace.toObject(),
            role: membership.role
        }));
};

// Add an existing organization member to a workspace.

export const addWorkspaceMember = async ({
    workspaceId,
    targetUserId,
    userId,
    role = "member"
}) => {
    const workspace = await verifyWorkspaceAdmin(workspaceId, userId);

    const allowedRoles = ["admin", "member", "viewer"];

    if (!allowedRoles.includes(role)) {
        throw createError(400, "Invalid workspace role");
    }

    const targetOrganizationMembership = await Membership.findOne({
        organization: workspace.organization,
        user: targetUserId
    });

    if (!targetOrganizationMembership) {
        throw createError(
            400,
            "This user must join the organization before joining a workspace"
        );
    }

    try {
        const workspaceMember = await WorkspaceMember.create({
            user: targetUserId,
            workspace: workspaceId,
            role,
            addedBy: userId
        });

        // Generate workspace invitation notification
        await createNotification({
            recipient: targetUserId,
            sender: userId,
            type: "workspace_invitation",
            message: `You have been added to workspace: ${workspace.name}`,
            workspace: workspaceId
        });

        return await WorkspaceMember.findById(workspaceMember._id)
            .populate("user", "name username email")
            .populate("addedBy", "name username");

    } catch (error) {
        if (error.code === 11000) {
            throw createError(
                409,
                "This user is already a member of the workspace"
            );
        }

        throw error;
    }
};


// List all members of a workspace.
export const getWorkspaceMembers = async ({
    workspaceId,
    userId
}) => {
    await verifyWorkspaceMember(workspaceId, userId);

    return await WorkspaceMember.find({ workspace: workspaceId })
        .populate("user", "name username email")
        .populate("addedBy", "name username")
        .sort({ joinedAt: 1 });
};

// Remove a member from a workspace.
export const removeWorkspaceMember = async ({
    workspaceId,
    targetUserId,
    userId
}) => {
    await verifyWorkspaceAdmin(workspaceId, userId);

    const session = await mongoose.startSession();

    try {
        let removedMember;

        await session.withTransaction(async () => {
            const targetMembership = await WorkspaceMember.findOne({
                workspace: workspaceId,
                user: targetUserId
            }).session(session);

            if (!targetMembership) {
                throw createError(404, "Workspace member not found");
            }

            if (targetMembership.role === "admin") {
                const adminCount = await WorkspaceMember.countDocuments({
                    workspace: workspaceId,
                    role: "admin"
                }).session(session);

                if (adminCount <= 1) {
                    throw createError(
                        400,
                        "You cannot remove the last workspace admin"
                    );
                }
            }

            removedMember = await WorkspaceMember.findOneAndDelete({
                workspace: workspaceId,
                user: targetUserId
            }).session(session);
        });

        return removedMember;
    } finally {
        await session.endSession();
    }
};

// Change a workspace member's role.
export const updateWorkspaceMemberRole = async ({
    workspaceId,
    targetUserId,
    userId,
    role
}) => {
    await verifyWorkspaceAdmin(workspaceId, userId);

    const allowedRoles = ["admin", "member", "viewer"];

    if (!allowedRoles.includes(role)) {
        throw createError(400, "Invalid workspace role");
    }

    const session = await mongoose.startSession();

    try {
        let updatedMember;

        await session.withTransaction(async () => {
            const targetMembership = await WorkspaceMember.findOne({
                workspace: workspaceId,
                user: targetUserId
            }).session(session);

            if (!targetMembership) {
                throw createError(404, "Workspace member not found");
            }

            // Don't allow the last admin to lose admin privileges.
            if (targetMembership.role === "admin" && role !== "admin") {
                const adminCount = await WorkspaceMember.countDocuments({
                    workspace: workspaceId,
                    role: "admin"
                }).session(session);

                if (adminCount <= 1) {
                    throw createError(
                        400,
                        "You cannot demote the last workspace admin"
                    );
                }
            }

            updatedMember = await WorkspaceMember.findOneAndUpdate(
                {
                    workspace: workspaceId,
                    user: targetUserId
                },
                { role },
                {
                    new: true,
                    runValidators: true,
                    session
                }
            )
                .populate("user", "name username email")
                .populate("addedBy", "name username");
        });

        return updatedMember;
    } finally {
        await session.endSession();
    }
};
