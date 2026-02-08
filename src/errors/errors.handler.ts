import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error.base';
// import { logger } from './infra/logger';

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            data: [],
            success: false
        });
    }

    //   logger.error({
    //     message: err.message,
    //     stack: err.stack,
    //     path: req.path,
    //     method: req.method,
    //   });

    return res.status(500).json({
        error: 'Internal server error',
    });
}
