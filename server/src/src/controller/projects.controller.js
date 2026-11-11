import asyncHandler from "express-async-handler";
import createError from "http-errors";

import {
    createProject,
    getWorkspaceProjects,
    getProjectById,
    updateProject,
    deleteProject
} from "../services/project.service.js";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// CREATE
export const createProjectController = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        workspaceId,
        priority,
        startDate,
        dueDate
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
        throw createError(400, "Project name is required");
    }

    if (!workspaceId || !isValidObjectId(workspaceId)) {
        throw createError(400, "A valid workspace ID is required");
    }

    const project = await createProject({
        name: name.trim(),
        description: description || "",
        workspaceId,
        userId: req.user._id,
        priority,
        startDate,
        dueDate
    });

    res.status(201).json({
        success: true,
        message: "Project created successfully",
        project
    });
});

// GET ALL PROJECTS
export const getWorkspaceProjectsController = asyncHandler(
    async (req, res) => {
        const { workspaceId } = req.params;

        if (!isValidObjectId(workspaceId)) {
            throw createError(400, "Invalid workspace ID");
        }

        const projects = await getWorkspaceProjects({
            workspaceId,
            userId: req.user._id
        });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });
    }
);

// GET SINGLE PROJECT
export const getProjectByIdController = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw createError(400, "Invalid project ID");
    }

    const project = await getProjectById({
        projectId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        project
    });
});

// UPDATE
export const updateProjectController = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw createError(400, "Invalid project ID");
    }

    const { name, description, status, priority, startDate, dueDate } = req.body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        throw createError(400, "Project name cannot be empty");
    }

    if (
        status !== undefined &&
        !["planning", "active", "completed", "archived"].includes(status)
    ) {
        throw createError(400, "Invalid project status");
    }

    if (
        priority !== undefined &&
        !["low", "medium", "high"].includes(priority)
    ) {
        throw createError(400, "Invalid project priority");
    }

    const project = await updateProject({
        projectId,
        userId: req.user._id,
        updates: {
            name: name?.trim(),
            description,
            status,
            priority,
            startDate,
            dueDate
        }
    });

    res.status(200).json({
        success: true,
        message: "Project updated successfully",
        project
    });
});

// DELETE
export const deleteProjectController = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw createError(400, "Invalid project ID");
    }

    const result = await deleteProject({
        projectId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        ...result
    });
});