import express from "express";

import {
    register,
    login,
    getMe,
    logout
} from "../controller/auth.controller.js";

import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

export default router;