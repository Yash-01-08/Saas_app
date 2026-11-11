
import { Queue } from "bullmq";
import redis from "./redis.js";

export const notificationQueue = new Queue("notifications", {
    connection: redis.duplicate(),
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 500
    }
});
