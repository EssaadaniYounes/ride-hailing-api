import { Response } from 'express';
import { config } from '../config/env';

export const setAuthCookies = (res: Response, authToken: string, refreshToken: string) => {
    const isProduction = config.server.nodeEnv === 'production';

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict' as const,
    };

    res.cookie('authToken', authToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 1000
    });
};
