import express from "express";
import protect from "../middlewares/auth.middleware.js";

import {
    createProjectController,
    getWorkspaceProjectsController,
    getProjectByIdController,
    updateProjectController,
    deleteProjectController
} from "../controller/projects.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", createProjectController);

router.get("/workspace/:workspaceId", getWorkspaceProjectsController);

router.get("/:projectId", getProjectByIdController);

router.patch("/:projectId", updateProjectController);

router.delete("/:projectId", deleteProjectController);

export default router;