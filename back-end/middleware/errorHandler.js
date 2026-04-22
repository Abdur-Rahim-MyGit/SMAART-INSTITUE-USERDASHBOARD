const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Handle Mongoose CastError (e.g., Invalid ID)
 */
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400, 'INVALID_INPUT');
};

/**
 * Handle MongoDB Duplicate Key Error (code 11000)
 */
const handleDuplicateFieldsDB = err => {
    // Extract the duplicated field value from the error message using regex
    const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'value';
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400, 'DUPLICATE_FIELD');
};

/**
 * Handle Mongoose Validation Error
 */
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400, 'VALIDATION_ERROR');
};

/**
 * Handle JWT Errors
 */
const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

/**
 * Development Error Response (Sends Stack Trace)
 */
const sendErrorDev = (err, req, res) => {
    // Log error using winston
    if (err.statusCode >= 500) {
        logger.error('Server Error (Dev):', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method
        });
    }

    return res.status(err.statusCode).json({
        success: false,
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

/**
 * Production Error Response (Sanitized)
 */
const sendErrorProd = (err, req, res) => {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
        logger.warn('Client Error:', {
            message: err.message,
            statusCode: err.statusCode,
            url: req.originalUrl,
            method: req.method
        });

        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            code: err.code
        });
    }
    
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    logger.error('Server Error (Prod):', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });

    // 2) Send generic message
    return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went very wrong!'
    });
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        let error = { ...err };
        error.message = err.message;
        error.name = err.name;
        error.isOperational = err.isOperational || false;

        // Transform specific Mongoose/DB errors into operational AppErrors
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};

/**
 * Handle 404 - Not Found
 */
const notFound = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
    next(error);
};

/**
 * Async Handler Wrapper for Controllers
 * Catches errors from async functions and passes them to next()
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = { errorHandler, notFound, catchAsync };
