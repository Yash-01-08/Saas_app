
import asyncHandler from "express-async-handler";
import createError from "http-errors";

import {
    createSprint,
    getProjectSprints,
    startSprint,
    completeSprint,
    assignTaskToSprint,
    removeTaskFromSprint
} from "../services/sprint.service.js";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Create sprint
export const createSprintController = asyncHandler(async (req, res) => {
    const { name, goal, projectId, startDate, endDate } = req.body;

    if (typeof name !== "string" || !name.trim()) {
        throw createError(400, "Sprint name is required");
    }

    if (!projectId || !isValidObjectId(projectId)) {
        throw createError(400, "Valid project ID is required");
    }

    const sprint = await createSprint({
        name: name.trim(),
        goal,
        projectId,
        userId: req.user._id,
        startDate,
        endDate
    });

    res.status(201).json({
        success: true,
        message: "Sprint created successfully",
        sprint
    });
});

// Get project sprints
export const getProjectSprintsController = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw createError(400, "Invalid project ID");
    }

    const sprints = await getProjectSprints({
        projectId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        count: sprints.length,
        sprints
    });
});

// Start sprint
export const startSprintController = asyncHandler(async (req, res) => {
    const { sprintId } = req.params;

    if (!isValidObjectId(sprintId)) {
        throw createError(400, "Invalid sprint ID");
    }

    const sprint = await startSprint({
        sprintId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        message: "Sprint started successfully",
        sprint
    });
});

// Complete sprint
export const completeSprintController = asyncHandler(async (req, res) => {
    const { sprintId } = req.params;

    if (!isValidObjectId(sprintId)) {
        throw createError(400, "Invalid sprint ID");
    }

    const sprint = await completeSprint({
        sprintId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        message: "Sprint completed successfully",
        sprint
    });
});

// Assign task to sprint
export const assignTaskToSprintController = asyncHandler(async (req, res) => {
    const { sprintId } = req.params;
    const { taskId } = req.body;

    if (!isValidObjectId(sprintId) || !isValidObjectId(taskId)) {
        throw createError(400, "Invalid sprint or task ID");
    }

    const task = await assignTaskToSprint({
        sprintId,
        taskId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        message: "Task assigned to sprint successfully",
        task
    });
});

// Move task back to backlog
export const removeTaskFromSprintController = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!isValidObjectId(taskId)) {
        throw createError(400, "Invalid task ID");
    }

    const task = await removeTaskFromSprint({
        taskId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        message: "Task moved back to backlog",
        task
    });
});
