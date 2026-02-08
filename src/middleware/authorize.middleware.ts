import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate.middleware';
import { ForbiddenError } from '../errors/domain-errors.base';
import { Role } from '../config/role.enum';

export const authorize = (...allowedRoles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new ForbiddenError('User not authenticated'));
        }

        if (!req.user.role || !allowedRoles.includes(req.user.role as Role)) {
            return next(new ForbiddenError('You do not have permission to access this resource'));
        }

        next();
    };
};
