
import crypto from "crypto";
import path from "path";
import createError from "http-errors";

import {
    PutObjectCommand,
    HeadObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import s3 from "../config/s3.js";

import File from "../models/File.js";
import WorkspaceMember from "../models/workspaceMember.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

const BUCKET = process.env.AWS_S3_BUCKET;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

// Verify workspace membership.
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

// Verify project and task belong to the requested workspace.
const verifyFileLocation = async ({
    workspaceId,
    projectId,
    taskId
}) => {
    if (projectId) {
        const project = await Project.findOne({
            _id: projectId,
            workspace: workspaceId
        });

        if (!project) {
            throw createError(404, "Project not found in this workspace");
        }
    }

    if (taskId) {
        if (!projectId) {
            throw createError(400, "Project ID is required for task attachments");
        }

        const task = await Task.findOne({
            _id: taskId,
            project: projectId,
            workspace: workspaceId
        });

        if (!task) {
            throw createError(404, "Task not found in this project");
        }
    }
};

// Generate a temporary upload URL.
export const generateUploadUrl = async ({
    fileName,
    contentType,
    fileSize,
    workspaceId,
    projectId,
    taskId,
    userId
}) => {
    if (!fileName || typeof fileName !== "string") {
        throw createError(400, "File name is required");
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
        throw createError(400, "File type is not supported");
    }

    if (
        !Number.isInteger(fileSize) ||
        fileSize <= 0 ||
        fileSize > MAX_FILE_SIZE
    ) {
        throw createError(400, "File size must be between 1 byte and 10 MB");
    }

    const membership = await verifyWorkspaceMember(
        workspaceId,
        userId
    );

    await verifyFileLocation({
        workspaceId,
        projectId,
        taskId
    });

    const extension = path.extname(fileName).toLowerCase();

    const safeKey = `attachments/${workspaceId}/${crypto.randomUUID()}${extension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: safeKey,
        ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(
        s3,
        command,
        {
            expiresIn: 300
        }
    );

    return {
        uploadUrl,
        s3Key: safeKey,
        expiresIn: 300
    };
};

// Confirm upload and save metadata in MongoDB.
export const confirmUpload = async ({
    s3Key,
    fileName,
    contentType,
    fileSize,
    workspaceId,
    projectId,
    taskId,
    userId
}) => {
    if (!s3Key || !fileName || !workspaceId) {
        throw createError(400, "Required file information is missing");
    }

    if (
        typeof s3Key !== "string" ||
        !s3Key.startsWith(`attachments/${workspaceId}/`) ||
        s3Key.includes("..")
    ) {
        throw createError(400, "Invalid file key");
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
        throw createError(400, "Unsupported file type");
    }

    if (
        !Number.isInteger(fileSize) ||
        fileSize <= 0 ||
        fileSize > MAX_FILE_SIZE
    ) {
        throw createError(400, "Invalid file size");
    }

    await verifyWorkspaceMember(workspaceId, userId);

    await verifyFileLocation({
        workspaceId,
        projectId,
        taskId
    });

    // Check that the object really exists in S3.
    let uploadedObject;

    try {
        uploadedObject = await s3.send(
            new HeadObjectCommand({
                Bucket: BUCKET,
                Key: s3Key
            })
        );
    } catch (error) {
        if (
            error.name === "NotFound" ||
            error.$metadata?.httpStatusCode === 404
        ) {
            throw createError(400, "File has not been uploaded to S3");
        }

        throw error;
    }

    // Validate actual uploaded object metadata.
    if (
        uploadedObject.ContentLength !== fileSize ||
        uploadedObject.ContentType !== contentType
    ) {
        throw createError(400, "Uploaded file information does not match");
    }

    const existingFile = await File.findOne({ s3Key });

    if (existingFile) {
        throw createError(409, "File has already been registered");
    }

    const file = await File.create({
        originalName: path.basename(fileName),
        s3Key,
        mimeType: contentType,
        size: uploadedObject.ContentLength,
        uploadedBy: userId,
        workspace: workspaceId,
        project: projectId || null,
        task: taskId || null
    });

    return file;
};

// Generate a secure download URL.
export const generateDownloadUrl = async ({
    fileId,
    userId
}) => {
    const file = await File.findById(fileId);

    if (!file) {
        throw createError(404, "File not found");
    }

    await verifyWorkspaceMember(file.workspace, userId);

    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: file.s3Key
    });

    const downloadUrl = await getSignedUrl(
        s3,
        command,
        {
            expiresIn: 300
        }
    );

    return {
        downloadUrl,
        expiresIn: 300
    };
};

// Delete a file.
export const deleteFile = async ({
    fileId,
    userId
}) => {
    const file = await File.findById(fileId);

    if (!file) {
        throw createError(404, "File not found");
    }

    const membership = await verifyWorkspaceMember(
        file.workspace,
        userId
    );

    const isUploader = file.uploadedBy.toString() === userId.toString();
    const isAdmin = membership.role === "admin";

    if (!isUploader && !isAdmin) {
        throw createError(403, "You cannot delete this file");
    }

    // Delete from S3 first.
    await s3.send(
        new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: file.s3Key
        })
    );

    // Delete metadata only after successful S3 operation.
    await File.findByIdAndDelete(fileId);

    return {
        message: "File deleted successfully"
    };
};

export const getWorkspaceFiles = async ({
    workspaceId,
    userId
}) => {
    await verifyWorkspaceMember(workspaceId, userId);

    return File.find({ workspace: workspaceId })
        .populate("uploadedBy", "name username")
        .sort({ createdAt: -1 });
};
