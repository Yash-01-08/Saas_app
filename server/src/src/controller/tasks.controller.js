
import asyncHandler from "express-async-handler";
import createError from "http-errors";

import {
    createTask,
    getProjectTasks,
    updateTask,
    deleteTask
} from "../services/task.service.js";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// CREATE TASK
export const createTaskController = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        projectId,
        assignedTo,
        priority,
        dueDate
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
        throw createError(400, "Task title is required");
    }

    if (!projectId || !isValidObjectId(projectId)) {
        throw createError(400, "Valid project ID is required");
    }

    if (assignedTo && !isValidObjectId(assignedTo)) {
        throw createError(400, "Invalid assignee ID");
    }

    if (
        priority &&
        !["low", "medium", "high", "urgent"].includes(priority)
    ) {
        throw createError(400, "Invalid task priority");
    }

    const task = await createTask({
        title: title.trim(),
        description: description || "",
        projectId,
        userId: req.user._id,
        assignedTo,
        priority,
        dueDate
    });

    res.status(201).json({
        success: true,
        message: "Task created successfully",
        task
    });
});

// GET PROJECT TASKS
export const getProjectTasksController = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw createError(400, "Invalid project ID");
    }

    const tasks = await getProjectTasks({
        projectId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        count: tasks.length,
        tasks
    });
});

// UPDATE TASK
export const updateTaskController = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!isValidObjectId(taskId)) {
        throw createError(400, "Invalid task ID");
    }

    const { title, description, status, priority, assignedTo, dueDate } =
        req.body;

    if (title !== undefined && (!title.trim() || typeof title !== "string")) {
        throw createError(400, "Task title cannot be empty");
    }

    if (
        status !== undefined &&
        !["todo", "in_progress", "in_review", "done"].includes(status)
    ) {
        throw createError(400, "Invalid task status");
    }

    if (
        priority !== undefined &&
        !["low", "medium", "high", "urgent"].includes(priority)
    ) {
        throw createError(400, "Invalid task priority");
    }

    if (assignedTo !== undefined && assignedTo !== null && !isValidObjectId(assignedTo)) {
        throw createError(400, "Invalid assignee ID");
    }

    const updates = {
        title: title?.trim(),
        description,
        status,
        priority,
        assignedTo,
        dueDate
    };

    const task = await updateTask({
        taskId,
        userId: req.user._id,
        updates
    });

    res.status(200).json({
        success: true,
        message: "Task updated successfully",
        task
    });
});

// DELETE TASK
export const deleteTaskController = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!isValidObjectId(taskId)) {
        throw createError(400, "Invalid task ID");
    }

    const result = await deleteTask({
        taskId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        ...result
    });
});
