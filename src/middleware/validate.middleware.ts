import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../errors/domain-errors.base';

export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error: any) {
            const message = error.errors?.map((e: any) => e.message).join(', ') || 'Validation failed';
            next(new BadRequestError(message));
        }
    };
};
