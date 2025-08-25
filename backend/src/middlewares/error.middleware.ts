import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import { StatusCode } from "../enums/statusCode.enum";
import { ErrorMessages } from "../enums/messages.enum";

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error(err.stack);

    const statusCode = err.statusCode || StatusCode.INTERNAL_SERVER_ERROR;
    const message = err.message || ErrorMessages.SERVER_ERROR;

    res.status(statusCode).json({
        error: {
            message: message,
            status: statusCode,
        }
    });
};

export class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
