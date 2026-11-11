import { RateLimiterRedis } from "rate-limiter-flexible";
import redis from "../config/redis.js";
import createError from "http-errors";

const rateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "api_rate_limit",
    points: 100,
    duration: 60,
    blockDuration: 60
});

const rateLimiterMiddleware = async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (error) {
        if (error instanceof Error) {
            return next(error);
        }

        return next(createError(
            429,
            "Too many requests. Please try again later."
        ));
    }
};

export default rateLimiterMiddleware;
