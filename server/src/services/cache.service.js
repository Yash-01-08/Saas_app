
import redis from "../config/redis.js";

export const getCache = async (key) => {
    try {
        const cachedData = await redis.get(key);

        if (!cachedData) {
            return null;
        }

        return JSON.parse(cachedData);
    } catch (error) {
        console.error("Redis cache read failed:", error.message);
        return null;
    }
};

export const setCache = async (key, data, expiration = 300) => {
    try {
        await redis.set(
            key,
            JSON.stringify(data),
            "EX",
            expiration
        );
    } catch (error) {
        console.error("Redis cache write failed:", error.message);
    }
};

export const deleteCache = async (key) => {
    try {
        await redis.del(key);
    } catch (error) {
        console.error("Redis cache deletion failed:", error.message);
    }
};
