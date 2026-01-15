import { NextFunction, Request, Response } from "express";
import { ValidationError } from "class-validator";
import logger from "../utils/logger";
import { StatusCode } from "../enums/statusCode.enum";
import { ErrorMessages } from "../enums/messages.enum";
import { CustomError } from "../utils/customError";


export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    logger.error("Global error handler:", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.method === 'POST' || req.method === 'PUT' ?
            { ...req.body, password: req.body.password ? '[REDACTED]' : undefined } :
            undefined
    });

    // Handle CustomError
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
            statusCode: err.statusCode
        });
    }

    // Handle Validation Errors
    if (err instanceof ValidationError) {
        return res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            error: ErrorMessages.VALIDATION_ERROR,
            details: err.constraints
        });
    }

    // Handle MongoDB/Mongoose Errors
    if (err.name === 'MongoError' || err.name === 'MongooseError') {
        logger.error("Database error:", err);
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ErrorMessages.DATABASE_ERROR
        });
    }

    // Handle JWT Errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(StatusCode.UNAUTHORIZED).json({
            success: false,
            error: ErrorMessages.INVALID_TOKEN
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(StatusCode.UNAUTHORIZED).json({
            success: false,
            error: ErrorMessages.TOKEN_EXPIRED
        });
    }

    // Handle Multer Errors (File Upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            error: ErrorMessages.FILE_TOO_LARGE
        });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            error: ErrorMessages.INVALID_FILE_TYPE
        });
    }

    // Handle Rate Limiting
    if (err.status === StatusCode.TOO_MANY_REQUESTS) {
        return res.status(StatusCode.TOO_MANY_REQUESTS).json({
            success: false,
            error: ErrorMessages.RATE_LIMIT_EXCEEDED
        });
    }

    // Default server error
    const statusCode = err.statusCode || StatusCode.INTERNAL_SERVER_ERROR;
    const message = err.message || ErrorMessages.SERVER_ERROR;

    res.status(statusCode).json({
        success: false,
        error: message,
        statusCode,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err
        })
    });
};

export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}