import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../errors/domain-errors.base';
import logger from '../lib/logger.lib';

export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error: any) {
            logger.error(error);
            const message = error.errors?.map((e: any) => e.message).join(', ') || 'Validation failed';
            next(new BadRequestError(message));
        }
    };
};
