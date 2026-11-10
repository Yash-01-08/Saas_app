
import createError from "http-errors";

import Sprint from "../models/Sprint.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import WorkspaceMember from "../models/workspaceMember.js";
import { createNotification } from "./notification.service.js";

// Verify workspace admin
const verifyWorkspaceAdmin = async (workspaceId, userId) => {
    const membership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId
    });

    if (!membership) {
        throw createError(403, "You are not a member of this workspace");
    }

    if (membership.role !== "admin") {
        throw createError(403, "Only workspace admins can manage sprints");
    }
};

// Notify all workspace members except the sender
const notifyWorkspaceMembers = async ({
    workspaceId,
    userId,
    type,
    message,
    sprint,
    project
}) => {
    const members = await WorkspaceMember.find({
        workspace: workspaceId,
        user: { $ne: userId }
    }).select("user");

    const notifications = members.map(member =>
        createNotification({
            recipient: member.user,
            sender: userId,
            type,
            message,
            sprint,
            project,
            workspace: workspaceId
        })
    );

    await Promise.all(notifications);
};

// Create sprint
export const createSprint = async ({
    name,
    goal,
    projectId,
    userId,
    startDate,
    endDate
}) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw createError(404, "Project not found");
    }

    await verifyWorkspaceAdmin(project.workspace, userId);

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        throw createError(400, "End date cannot be before start date");
    }

    return Sprint.create({
        name,
        goal,
        project: projectId,
        workspace: project.workspace,
        createdBy: userId,
        startDate: startDate || null,
        endDate: endDate || null
    });
};

// Get all sprints of a project
export const getProjectSprints = async ({ projectId, userId }) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw createError(404, "Project not found");
    }

    const membership = await WorkspaceMember.findOne({
        workspace: project.workspace,
        user: userId
    });

    if (!membership) {
        throw createError(403, "You are not a member of this workspace");
    }

    return Sprint.find({ project: projectId })
        .populate("createdBy", "name username")
        .sort({ createdAt: -1 });
};

// Start sprint
export const startSprint = async ({ sprintId, userId }) => {
    const sprint = await Sprint.findById(sprintId);

    if (!sprint) {
        throw createError(404, "Sprint not found");
    }

    await verifyWorkspaceAdmin(sprint.workspace, userId);

    if (sprint.status !== "planned") {
        throw createError(400, "Only planned sprints can be started");
    }

    const activeSprint = await Sprint.findOne({
        project: sprint.project,
        status: "active"
    });

    if (activeSprint) {
        throw createError(400, "Another sprint is already active for this project");
    }

    sprint.status = "active";

    if (!sprint.startDate) {
        sprint.startDate = new Date();
    }

    await sprint.save();

    // Notify workspace members
    await notifyWorkspaceMembers({
        workspaceId: sprint.workspace,
        userId,
        type: "sprint_started",
        message: `Sprint "${sprint.name}" has started`,
        sprint: sprint._id,
        project: sprint.project
    });

    return sprint;
};

// Complete sprint
export const completeSprint = async ({ sprintId, userId }) => {
    const sprint = await Sprint.findById(sprintId);

    if (!sprint) {
        throw createError(404, "Sprint not found");
    }

    await verifyWorkspaceAdmin(sprint.workspace, userId);

    if (sprint.status !== "active") {
        throw createError(400, "Only active sprints can be completed");
    }

    sprint.status = "completed";

    await sprint.save();

    // Notify workspace members
    await notifyWorkspaceMembers({
        workspaceId: sprint.workspace,
        userId,
        type: "sprint_completed",
        message: `Sprint "${sprint.name}" has been completed`,
        sprint: sprint._id,
        project: sprint.project
    });

    return sprint;
};

// Assign task to sprint
export const assignTaskToSprint = async ({
    sprintId,
    taskId,
    userId
}) => {
    const sprint = await Sprint.findById(sprintId);

    if (!sprint) {
        throw createError(404, "Sprint not found");
    }

    await verifyWorkspaceAdmin(sprint.workspace, userId);

    if (sprint.status === "completed") {
        throw createError(400, "Cannot assign tasks to a completed sprint");
    }

    const task = await Task.findById(taskId);

    if (!task) {
        throw createError(404, "Task not found");
    }

    if (task.project.toString() !== sprint.project.toString()) {
        throw createError(400, "Task and sprint must belong to the same project");
    }

    task.sprint = sprint._id;

    await task.save();

    return task;
};

// Remove task from sprint (move back to backlog)
export const removeTaskFromSprint = async ({
    taskId,
    userId
}) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw createError(404, "Task not found");
    }

    await verifyWorkspaceAdmin(task.workspace, userId);

    task.sprint = null;

    await task.save();

    return task;
};
