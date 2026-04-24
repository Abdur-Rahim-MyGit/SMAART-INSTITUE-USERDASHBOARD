const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Enhanced Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
    // Set default values
    err.statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    err.status = err.status || 'error';

    // Log error
    if (err.statusCode >= 500) {
        logger.error('Server Error:', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userId: req.user?.id,
        });
    } else if (err.statusCode === 404) {
        logger.warn('[404] Route not found:', {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
        });
    } else {
        logger.warn('Client Error:', {
            message: err.message,
            statusCode: err.statusCode,
            url: req.originalUrl,
            method: req.method,
        });
    }

    // Development: Send detailed error
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            error: err.name || 'Error',
            message: err.message,
            stack: err.stack,
            code: err.code,
            timestamp: new Date().toISOString(),
        });
    }

    // Production: Send limited error details
    // Only send error message if it's an operational error
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            code: err.code,
            errors: err.errors,
            timestamp: new Date().toISOString(),
        });
    }

    // Programming or unknown errors: don't leak details
    return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong. Please try again later.',
        timestamp: new Date().toISOString(),
    });
};

/**
 * Handle 404 - Not Found
 */
const notFound = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
    next(error);
};

module.exports = { errorHandler, notFound };
