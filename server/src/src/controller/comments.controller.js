
import asyncHandler from "express-async-handler";
import createError from "http-errors";
import {
    createComment,
    getTaskComments,
    updateComment,
    deleteComment
} from "../services/comment.service.js";

// POST - Create comment
export const createCommentController = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { taskId } = req.params;

    if (typeof content !== "string" || !content.trim()) {
        throw createError(400, "Comment content is required");
    }

    const comment = await createComment({
        taskId,
        content: content.trim(),
        userId: req.user._id
    });

    res.status(201).json({
        success: true,
        message: "Comment created successfully",
        data: comment
    });
});

// GET - Get comments for a task
export const getTaskCommentsController = asyncHandler(async (req, res) => {
    const comments = await getTaskComments(
        req.params.taskId,
        req.user._id
    );

    res.status(200).json({
        success: true,
        count: comments.length,
        data: comments
    });
});

// PATCH - Update comment
export const updateCommentController = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (typeof content !== "string" || !content.trim()) {
        throw createError(400, "Comment content is required");
    }

    const comment = await updateComment({
        commentId: req.params.commentId,
        content: content.trim(),
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        message: "Comment updated successfully",
        data: comment
    });
});

// DELETE - Delete comment
export const deleteCommentController = asyncHandler(async (req, res) => {
    const result = await deleteComment({
        commentId: req.params.commentId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        ...result
    });
});
