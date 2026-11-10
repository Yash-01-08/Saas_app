
import { Worker } from "bullmq";

import redis from "../config/redis.js";
import Notification from "../models/Notification.js";

const notificationWorker = new Worker(
    "notifications",
    async (job) => {
        console.log(`Processing notification job: ${job.id}`);

        // Save notification in MongoDB.
        const notification = await Notification.create(job.data);

        console.log(`Notification created: ${notification._id}`);

        // Publish notification to the API server.
        await redis.publish(
            "notifications",
            JSON.stringify({
                recipient: job.data.recipient.toString(),
                notification: notification.toObject()
            })
        );

        return {
            notificationId: notification._id
        };
    },
    {
        connection: redis.duplicate(),
        concurrency: 5
    }
);

notificationWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

notificationWorker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
});

notificationWorker.on("error", (error) => {
    console.error("Notification worker error:", error.message);
});

console.log("Notification worker is running...");

export default notificationWorker;
