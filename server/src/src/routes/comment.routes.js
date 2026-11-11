
import express from "express";
import protect from "../middlewares/auth.middleware.js";

import {
    createCommentController,
    getTaskCommentsController,
    updateCommentController,
    deleteCommentController
} from "../controller/comments.controller.js";

const router = express.Router();

router.use(protect);

// Create comment on a task
router.post("/task/:taskId", createCommentController);

// Get all comments for a task
router.get("/task/:taskId", getTaskCommentsController);

// Update a comment
router.patch("/:commentId", updateCommentController);

// Delete a comment
router.delete("/:commentId", deleteCommentController);

export default router;
