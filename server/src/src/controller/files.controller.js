
import asyncHandler from "express-async-handler";

import {
    generateUploadUrl,
    confirmUpload,
    generateDownloadUrl,
    deleteFile,
    getWorkspaceFiles
} from "../services/file.service.js";
import {
    getProjectFiles,
    getTaskFiles
} from "../services/file.service.js";

// POST /api/files/upload-url
export const getUploadUrl = asyncHandler(async (req, res) => {
    const result = await generateUploadUrl({
        ...req.body,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        ...result
    });
});

// POST /api/files/confirm
export const confirmFileUpload = asyncHandler(async (req, res) => {
    const file = await confirmUpload({
        ...req.body,
        userId: req.user._id
    });

    res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        file
    });
});

// GET /api/files/:fileId/download-url
export const getFileDownloadUrl = asyncHandler(async (req, res) => {
    const result = await generateDownloadUrl({
        fileId: req.params.fileId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        ...result
    });
});

// DELETE /api/files/:fileId
export const removeFile = asyncHandler(async (req, res) => {
    const result = await deleteFile({
        fileId: req.params.fileId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        ...result
    });
});


export const getWorkspaceAttachments = asyncHandler(async (req, res) => {
    const files = await getWorkspaceFiles({
        workspaceId: req.params.workspaceId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        count: files.length,
        files
    });
});

export const getProjectAttachments = asyncHandler(async (req, res) => {
    const files = await getProjectFiles({
        projectId: req.params.projectId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        count: files.length,
        files
    });
});


export const getTaskAttachments = asyncHandler(async (req, res) => {
    const files = await getTaskFiles({
        taskId: req.params.taskId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        count: files.length,
        files
    });
});