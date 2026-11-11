
import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";

const { default: app } = await import("./app.js");
const { connectToMongoDB } = await import("./config/db.js");
const { default: redis } = await import("./config/redis.js");
const { initializeSocket } = await import("./config/socket.js");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        console.log("MongoDB URI loaded:", Boolean(process.env.MONGO_URI));

        await connectToMongoDB();

        const redisResponse = await redis.ping();

        if (redisResponse !== "PONG") {
            throw new Error("Redis health check failed");
        }

        console.log("Redis is ready:", redisResponse);

        // Start the notification worker only after its MongoDB and Redis
        // dependencies are available. This keeps API and worker startup aligned.
        await import("./workers/notification.worker.js");

        const httpServer = createServer(app);

        initializeSocket(httpServer);

        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
