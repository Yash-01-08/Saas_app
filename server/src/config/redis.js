import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on("error", (error) => {
    console.error("Redis Error:", error);
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Redis Connected Successfully");
    } catch (error) {
        console.error("Redis Connection Failed:", error.message);
        process.exit(1);
    }
};

export { redisClient, connectRedis };