
import createError from "http-errors";
import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/workspaceMember.js";
import Membership from "../models/membership.js";
import { getCache, setCache, deleteCache } from "./cache.service.js";

const verifyWorkspaceAccess = async (workspaceId, userId) => {
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
        throw createError(403, "You are not a member of this workspace");
    }

    return { workspace, workspaceMembership };
};

const verifyWorkspaceAdmin = async (workspaceId, userId) => {
    const { workspace, workspaceMembership } =
        await verifyWorkspaceAccess(workspaceId, userId);

    if (workspaceMembership.role !== "admin") {
        throw createError(403, "Only workspace admins can perform this action");
    }

    return workspace;
};

// CREATE PROJECT
export const createProject = async ({
    name,
    description,
    workspaceId,
    userId,
    priority,
    startDate,
    dueDate
}) => {
    const workspace = await verifyWorkspaceAdmin(workspaceId, userId);

    const project = await Project.create({
        name,
        description,
        workspace: workspace._id,
        createdBy: userId,
        priority,
        startDate,
        dueDate
    });

    await deleteCache(`workspace_projects:${workspaceId}`);

    return project;
};

// GET ALL PROJECTS IN A WORKSPACE
export const getWorkspaceProjects = async ({ workspaceId, userId }) => {
    await verifyWorkspaceAccess(workspaceId, userId);

    const cacheKey = `workspace_projects:${workspaceId}`;

    const cachedProjects = await getCache(cacheKey);

    if (cachedProjects) {
        console.log("Projects cache hit");
        return cachedProjects;
    }

    console.log("Projects cache miss");

    const projects = await Project.find({ workspace: workspaceId })
        .populate("createdBy", "name username")
        .sort({ createdAt: -1 });

    await setCache(cacheKey, projects, 300);

    return projects;
};

// GET SINGLE PROJECT
export const getProjectById = async ({ projectId, userId }) => {
    const project = await Project.findById(projectId)
        .populate("createdBy", "name username");

    if (!project) {
        throw createError(404, "Project not found");
    }

    await verifyWorkspaceAccess(project.workspace, userId);

    return project;
};

// UPDATE PROJECT
export const updateProject = async ({
    projectId,
    userId,
    updates
}) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw createError(404, "Project not found");
    }

    await verifyWorkspaceAdmin(project.workspace, userId);

    const allowedFields = [
        "name",
        "description",
        "status",
        "priority",
        "startDate",
        "dueDate"
    ];

    allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
            project[field] = updates[field];
        }
    });

    await project.save();

    await deleteCache(`workspace_projects:${project.workspace}`);

    return project;
};

// DELETE PROJECT
export const deleteProject = async ({ projectId, userId }) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw createError(404, "Project not found");
    }

    await verifyWorkspaceAdmin(project.workspace, userId);

    await project.deleteOne();

    await deleteCache(`workspace_projects:${project.workspace}`);

    return { message: "Project deleted successfully" };
};
