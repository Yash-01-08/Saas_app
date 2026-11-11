const errorHandler = (err, req, res, next) => {
    const statusCode = err.code === 11000
        ? 409
        : err.statusCode || err.status || 500;

    const message = err.code === 11000
        ? "A record with these details already exists"
        : statusCode === 500 && process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message || "Something went wrong";

    res.status(statusCode).json({
        success: false,
        message
    });
};

export default errorHandler;
