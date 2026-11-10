
import express from "express";

import protect from "../middlewares/auth.middleware.js";

import {
    getUploadUrl,
    confirmFileUpload,
    getFileDownloadUrl,
    removeFile,
    getWorkspaceAttachments
} from "../controller/files.controller.js";

const router = express.Router();

router.use(protect);

router.post("/upload-url", getUploadUrl);

router.post("/confirm", confirmFileUpload);

router.get(
    "/workspace/:workspaceId",
    getWorkspaceAttachments
);

router.get("/:fileId/download-url", getFileDownloadUrl);

router.delete("/:fileId", removeFile);

export default router;
    