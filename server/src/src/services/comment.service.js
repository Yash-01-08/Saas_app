
import createHttpError from "http-errors";

import Comment from "../models/comment.js";
import Task from "../models/Task.js";
import WorkspaceMember from "../models/workspaceMember.js";
import { createNotification } from "./notification.service.js";

// Check whether a user belongs to the workspace
const verifyWorkspaceMember = async (workspaceId, userId) => {
    const membership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId
    });

    if (!membership) {
        throw createHttpError(403, "You are not a member of this workspace");
    }

    return membership;
};

// Create a comment on a task
export const createComment = async ({ taskId, content, userId }) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw createHttpError(404, "Task not found");
    }

    await verifyWorkspaceMember(task.workspace, userId);

    const comment = await Comment.create({
        content,
        task: task._id,
        project: task.project,
        workspace: task.workspace,
        author: userId
    });

    // Collect task creator and assignee
    const recipients = new Set([
        task.createdBy?.toString(),
        task.assignedTo?.toString()
    ]);

    // Remove empty IDs and the commenter
    recipients.delete(undefined);
    recipients.delete(null);
    recipients.delete(userId.toString());

    // Notify relevant users
    for (const recipient of recipients) {
        await createNotification({
            recipient,
            sender: userId,
            type: "task_commented",
            message: `Someone commented on task: ${task.title}`,
            task: task._id,
            project: task.project,
            workspace: task.workspace
        });
    }

    return comment.populate("author", "name username");
};

// Get all comments for a task
export const getTaskComments = async (taskId, userId) => {
    const task = await Task.findById(taskId);

    if (!task) {
        throw createHttpError(404, "Task not found");
    }

    await verifyWorkspaceMember(task.workspace, userId);

    return Comment.find({ task: taskId })
        .populate("author", "name username")
        .sort({ createdAt: 1 });
};

// Update a comment
export const updateComment = async ({ commentId, content, userId }) => {
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw createHttpError(404, "Comment not found");
    }

    await verifyWorkspaceMember(comment.workspace, userId);

    if (!comment.author.equals(userId)) {
        throw createHttpError(403, "You can only edit your own comments");
    }

    comment.content = content;
    await comment.save();

    return comment.populate("author", "name username");
};

// Delete a comment
export const deleteComment = async ({ commentId, userId }) => {
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw createHttpError(404, "Comment not found");
    }

    await verifyWorkspaceMember(comment.workspace, userId);

    if (!comment.author.equals(userId)) {
        throw createHttpError(403, "You can only delete your own comments");
    }

    await comment.deleteOne();

    return {
        message: "Comment deleted successfully"
    };
};
