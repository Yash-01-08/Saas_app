import jwt from "jsonwebtoken";
import createError from "http-errors";
import asyncHandler from "express-async-handler";

import User from "../models/user.js";

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Read token from Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        throw createError(401, "Not authorized. Token missing");
    }

    const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
        throw createError(401, "User no longer exists");
    }

    req.user = user;

    next();
});

export default protect;