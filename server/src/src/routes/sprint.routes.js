
import express from "express";
import protect from "../middlewares/auth.middleware.js";

import {
    createSprintController,
    getProjectSprintsController,
    startSprintController,
    completeSprintController,
    assignTaskToSprintController,
    removeTaskFromSprintController
} from "../controller/sprints.controller.js";

const router = express.Router();

router.use(protect);

// Create sprint
router.post("/", createSprintController);

// Get all sprints of a project
router.get("/project/:projectId", getProjectSprintsController);

// Start sprint
router.patch("/:sprintId/start", startSprintController);

// Complete sprint
router.patch("/:sprintId/complete", completeSprintController);

// Assign task to sprint
router.patch("/:sprintId/tasks", assignTaskToSprintController);

// Move task back to backlog
router.patch("/tasks/:taskId/backlog", removeTaskFromSprintController);

export default router;
