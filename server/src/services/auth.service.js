
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import createError from "http-errors";

// Register User

export const registerUser = async ({
    name,
    username,
    email,
    password,
    phone,
    company,
    role
}) => {

    // Normalize input
    username = username.trim().toLowerCase();
    email = email.trim().toLowerCase();

    // Check existing user
    const existingUser = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    });

    if (existingUser) {
        throw createError(409, "Username or email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
        name,
        username,
        email,
        password: hashedPassword,
        phone,
        company,role
    });

    return {
        userId: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        company: user.company,
        role: user.role,
        createdAt: user.createdAt
    };
};


// Login User
export const loginUser = async ({ username, password }) => {

    // Normalize username
    username = username.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
        throw createError(401, "Invalid username or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
      throw createError(401, "Invalid username or password");
    }

    // Generate JWT
    const token = jwt.sign(
        {
            id: user._id
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: "1d"
        }
    );

    return {
        token,
        user: {
            userId: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            company: user.company,
            role: user.role
        }
    };
};
