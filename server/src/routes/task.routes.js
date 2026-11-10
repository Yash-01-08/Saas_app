import express from "express";
import protect from "../middlewares/auth.middleware.js";

import {
    createTaskController,
    getProjectTasksController,
    updateTaskController,
    deleteTaskController
} from "../controller/tasks.controller.js";

const router = express.Router();

router.use(protect);

// Create a task
router.post("/", createTaskController);

// Get all tasks of a project
router.get("/project/:projectId", getProjectTasksController);

// Update a task
router.patch("/:taskId", updateTaskController);

// Delete a task
router.delete("/:taskId", deleteTaskController);

export default router;