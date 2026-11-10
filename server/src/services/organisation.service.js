
import mongoose from "mongoose";
import crypto from "crypto";
import createError from "http-errors";

import Organization from "../models/Organization.js";
import Membership from "../models/membership.js";
import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/workspaceMember.js";

export const createOrganization = async ({ name, description, userId }) => {
    const session = await mongoose.startSession();

    let organization;

    try {
        await session.withTransaction(async () => {
            const [newOrganization] = await Organization.create(
                [{
                    name,
                    description,
                    owner: userId
                }],
                { session }
            );

            organization = newOrganization;

            await Membership.create(
                [{
                    user: userId,
                    organization: organization._id,
                    role: "owner"
                }],
                { session }
            );

            const [defaultWorkspace] = await Workspace.create(
                [{
                    name: "General",
                    description: "Default workspace",
                    organization: organization._id,
                    createdBy: userId,
                    isDefault: true
                }],
                { session }
            );

            await WorkspaceMember.create(
                [{
                    user: userId,
                    workspace: defaultWorkspace._id,
                    role: "admin",
                    addedBy: userId
                }],
                { session }
            );
        });

        return await Organization.findById(organization._id);
    } finally {
        await session.endSession();
    }
};

export const joinOrganization = async ({ inviteCode, userId }) => {
    const normalizedCode = inviteCode.trim().toUpperCase();

    const organization = await Organization.findOne({
        inviteCode: normalizedCode,
        isInviteActive: true
    });

    if (!organization) {
        throw createError(404, "Invalid or inactive invite code");
    }

    try {
        const membership = await Membership.create({
            user: userId,
            organization: organization._id,
            role: "member"
        });

        return { organization, membership };
    } catch (error) {
        if (error.code === 11000) {
            throw createError(409, "You are already a member of this organization");
        }

        throw error;
    }
};

export const getMyOrganizations = async (userId) => {
    return await Membership.find({ user: userId })
        .populate("organization");
};

const verifyOrganizationAdmin = async (organizationId, userId) => {
    const membership = await Membership.findOne({
        organization: organizationId,
        user: userId
    });

    if (!membership || !["owner", "admin"].includes(membership.role)) {
        throw createError(403, "You are not authorized to manage this organization");
    }

    return membership;
};

export const regenerateInviteCode = async ({ organizationId, userId }) => {
    await verifyOrganizationAdmin(organizationId, userId);

    for (let attempt = 0; attempt < 5; attempt++) {
        const newCode = crypto.randomBytes(4).toString("hex").toUpperCase();

        try {
            const organization = await Organization.findByIdAndUpdate(
                organizationId,
                { inviteCode: newCode },
                { new: true, runValidators: true }
            );

            if (!organization) {
                throw createError(404, "Organization not found");
            }

            return organization;
        } catch (error) {
            if (error.code !== 11000) throw error;
        }
    }

    throw createError(500, "Could not generate a unique invite code");
};

export const updateInviteStatus = async ({
    organizationId,
    userId,
    isInviteActive
}) => {
    await verifyOrganizationAdmin(organizationId, userId);

    const organization = await Organization.findByIdAndUpdate(
        organizationId,
        { isInviteActive },
        { new: true, runValidators: true }
    );

    if (!organization) {
        throw createError(404, "Organization not found");
    }

    return organization;
};




