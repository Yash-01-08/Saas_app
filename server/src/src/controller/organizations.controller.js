import asyncHandler from "express-async-handler";
import createError from "http-errors";

import {
    createOrganization,
    joinOrganization,
    getMyOrganizations,
    regenerateInviteCode,
    updateInviteStatus
} from "../services/organization.service.js";

export const createOrganizationController = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
        throw createError(400, "Organization name is required");
    }

    const organization = await createOrganization({
        name: name.trim(),
        description: description || "",
        userId: req.user._id
    });

    res.status(201).json({
        success: true,
        message: "Organization created successfully",
        organization
    });
});

export const joinOrganizationController = asyncHandler(async (req, res) => {
    const { inviteCode } = req.body;

    if (!inviteCode || typeof inviteCode !== "string") {
        throw createError(400, "Invite code is required");
    }

    const result = await joinOrganization({
        inviteCode,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        message: "Joined organization successfully",
        ...result
    });
});

export const getMyOrganizationsController = asyncHandler(async (req, res) => {
    const memberships = await getMyOrganizations(req.user._id);

    res.status(200).json({
        success: true,
        count: memberships.length,
        organizations: memberships
    });
});

export const regenerateInviteCodeController = asyncHandler(async (req, res) => {
    const organization = await regenerateInviteCode({
        organizationId: req.params.organizationId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        message: "Invite code regenerated successfully",
        organization
    });
});

export const updateInviteStatusController = asyncHandler(async (req, res) => {
    const { isInviteActive } = req.body;

    if (typeof isInviteActive !== "boolean") {
        throw createError(400, "isInviteActive must be true or false");
    }

    const organization = await updateInviteStatus({
        organizationId: req.params.organizationId,
        userId: req.user._id,
        isInviteActive
    });

    res.status(200).json({
        success: true,
        message: `Invite code ${isInviteActive ? "activated" : "deactivated"} successfully`,
        organization
    });
});