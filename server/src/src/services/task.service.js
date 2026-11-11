
import createError from "http-errors";

import Task from "../models/Task.js";
import Project from "../models/Project.js";
import WorkspaceMember from "../models/workspaceMember.js";
import { createNotification } from "./notification.service.js";
import { getCache, setCache, deleteCache } from "./cache.service.js";

// Cache key helper
const getProjectTasksCacheKey = (projectId) =>
    `project_tasks:${projectId}`;

// Verify workspace membership
const verifyWorkspaceMember = async (workspaceId, userId) => {
    const membership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId
    });

    if (!membership) {
        throw createError(403, "You are not a member of this workspace");
    }

    return membership;
};

// Verify workspace admin
const verifyWorkspaceAdmin = async (workspaceId, userId) => {
    const membership = await verifyWorkspaceMember(workspaceId, userId);

    if (membership.role !== "admin") {
        throw createError(403, "Only workspace admins can manage tasks");
    }

    return membership;
};

// CREATE TASK
export const createTask = async ({
    title,
    description,
    projectId,
    userId,
    assignedTo,
    priority,
    dueDate
}) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw createError(404, "Project not found");
    }

    await verifyWorkspaceAdmin(project.workspace, userId);

    if (assignedTo) {
        await verifyWorkspaceMember(project.workspace, assignedTo);
    }

    const task = await Task.create({
        title,
        description,
        project: projectId,
        workspace: project.workspace,
        createdBy: userId,
        assignedTo: assignedTo || null,
        priority: priority || "medium",
        dueDate: dueDate || null
    });

    // Invalidate task cache
    await deleteCache(getProjectTasksCacheKey(projectId));

    // Notify assigned user
    if (assignedTo && assignedTo.toString() !== userId.toString()) {
        await createNotification({
            recipient: assignedTo,
            sender: userId,
            type: "task_assigned",
            message: `You have been assigned to task: ${task.title}`,
            task: task._id,
            project: project._id,
            workspace: project.workspace
        });
    }

    return task;
};

// GET PROJECT TASKS
export const getProjectTasks = async ({ projectId, userId }) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw createError(404, "Project not found");
    }

    await verifyWorkspaceMember(project.workspace, userId);

    const cacheKey = getProjectTasksCacheKey(projectId);

    const cachedTasks = await getCache(cacheKey);

    if (cachedTasks) {
        console.log("Tasks cache hit");
        return cachedTasks;
    }

    console.log("Tasks cache miss");

    const tasks = await Task.find({ project: projectId })
        .populate("assignedTo", "name username email")
        .populate("createdBy", "name username")
        .sort({ createdAt: -1 });

    await setCache(cacheKey, tasks, 300);

    return tasks;
};

// UPDATE TASK
export const updateTask = async ({
    taskId,
    userId,
    updates
}) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw createError(404, "Task not found");
    }

    const membership = await verifyWorkspaceMember(task.workspace, userId);

    const validUpdates = Object.fromEntries(
        Object.entries(updates).filter(
            ([, value]) => value !== undefined
        )
    );

    if (
        membership.role !== "admin" &&
        !(
            task.assignedTo &&
            task.assignedTo.toString() === userId.toString() &&
            Object.keys(validUpdates).length > 0 &&
            Object.keys(validUpdates).every(key => key === "status")
        )
    ) {
        throw createError(403, "You are not authorized to update this task");
    }

    const previousAssignee = task.assignedTo?.toString() || null;

    if (validUpdates.assignedTo) {
        await verifyWorkspaceMember(
            task.workspace,
            validUpdates.assignedTo
        );
    }

    Object.keys(validUpdates).forEach(key => {
        task[key] = validUpdates[key];
    });

    await task.save();

    // Invalidate task cache
    await deleteCache(getProjectTasksCacheKey(task.project));

    const newAssignee = task.assignedTo?.toString() || null;

    if (
        newAssignee &&
        newAssignee !== previousAssignee &&
        newAssignee !== userId.toString()
    ) {
        await createNotification({
            recipient: task.assignedTo,
            sender: userId,
            type: "task_assigned",
            message: `You have been assigned to task: ${task.title}`,
            task: task._id,
            project: task.project,
            workspace: task.workspace
        });
    }

    return task;
};

// DELETE TASK
export const deleteTask = async ({ taskId, userId }) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw createError(404, "Task not found");
    }

    await verifyWorkspaceAdmin(task.workspace, userId);

    await task.deleteOne();

    // Invalidate task cache
    await deleteCache(getProjectTasksCacheKey(task.project));

    return {
        message: "Task deleted successfully"
    };
};
