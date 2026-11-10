const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;

    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 && process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message || "Something went wrong"
    });
};

export default errorHandler;