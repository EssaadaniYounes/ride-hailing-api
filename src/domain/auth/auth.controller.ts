import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export const AuthController = {
    async register(req: Request, res: Response) {
        const body = req.body;
        const user = await AuthService.register(body);
        const authToken = AuthService.generateToken({ id: user.id }, '1h');
        const refreshToken = AuthService.generateToken({ id: user.id }, '1d');

        res.cookie('authToken', authToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 60 * 60 * 1000
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 60 * 60 * 24 * 1000
        });
        return res.status(201).json({
            message: 'User created successfully',
            data: {
                id: user.id,
                role: user.role,
                refreshToken,
                authToken
            }
        });
    },
    async login(req: Request, res: Response) {
        const body = req.body;
        const user = await AuthService.login(body);
        const authToken = AuthService.generateToken({ id: user.id }, '1h');
        const refreshToken = AuthService.generateToken({ id: user.id }, '1d');

        res.cookie('authToken', authToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 60 * 60 * 1000
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 60 * 60 * 24 * 1000
        });
        return res.status(201).json({
            message: 'User logged in successfully',
            data: {
                id: user.id,
                role: user.role,
                refreshToken,
                authToken
            }
        });
    }
}