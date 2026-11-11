import createError from "http-errors";

const notFound = (req, res, next) => {
    next(createError(404, `Route ${req.originalUrl} not found`));
};

export default notFound;