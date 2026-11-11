
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import User from "../models/user.js";
import redis from "./redis.js";

let io;

export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });

    // Authenticate every socket connection.
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication token missing"));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_ACCESS_SECRET
            );

            const user = await User.findById(decoded.id).select("_id");

            if (!user) {
                return next(new Error("User no longer exists"));
            }

            socket.data.userId = user._id.toString();

            next();
        } catch (error) {
            next(new Error("Invalid or expired authentication token"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.data.userId;

        // Each user receives events in their own room.
        socket.join(`user:${userId}`);

        console.log(`Socket connected: ${userId}`);

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${userId}`);
        });
    });

    // Separate Redis connection for Pub/Sub subscription.
    const subscriber = redis.duplicate();

    subscriber.subscribe("notifications", (error) => {
        if (error) {
            console.error("Redis subscription failed:", error.message);
        } else {
            console.log("Socket notification subscriber ready");
        }
    });

    subscriber.on("message", (channel, message) => {
        if (channel !== "notifications") return;

        try {
            const event = JSON.parse(message);

            io.to(`user:${event.recipient}`).emit(
                "notification:new",
                event.notification
            );
        } catch (error) {
            console.error("Socket notification event error:", error.message);
        }
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};
