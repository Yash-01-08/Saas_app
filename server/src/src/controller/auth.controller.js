import asyncHandler from "express-async-handler";
import createError from "http-errors";

import { registerUser, loginUser } from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
    const { name, username, email, password, phone, company } = req.body;

    if (!name || !username || !email || !password || !phone || !company) {
        throw createError(400, "All fields are required");
    }

    if (typeof password !== "string" || password.length < 8) {
        throw createError(400, "Password must be at least 8 characters");
    }

    const user = await registerUser({
        name, username, email, password, phone, company
    });

    res.status(201).json({
        success: true,
        message: "Account created successfully",
        user
    });
});

export const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        throw createError(400, "Username and password are required");
    }

    const result = await loginUser({ username, password });

    res.status(200).json({
        success: true,
        message: "Login successful",
        ...result
    });
});


export const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            userId: req.user._id,
            name: req.user.name,
            username: req.user.username,
            email: req.user.email,
            phone: req.user.phone,
            company: req.user.company,
            avatar: req.user.avatar,
            isVerified: req.user.isVerified
        }
    });
});

export const logout = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
});