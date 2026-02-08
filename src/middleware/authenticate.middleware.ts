import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UnauthorizedError } from '../errors/domain-errors.base';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role?: string;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.authToken ||
            req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            throw new UnauthorizedError('Authentication required');
        }

        const decoded = jwt.verify(token, config.jwt.secret) as { sub: string; role?: string };

        req.user = {
            id: decoded.sub,
            role: decoded.role
        };

        next();
    } catch (error: any) {
        if (error instanceof UnauthorizedError) {
            next(error);
        } else {
            next(new UnauthorizedError('Invalid or expired token'));
        }
    }
};
