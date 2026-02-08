import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { setAuthCookies } from "../../utils/cookie.helper";

export const AuthController = {
    async register(req: Request, res: Response) {
        const body = req.body;
        const user = await AuthService.register(body);
        const authToken = await AuthService.generateToken({ sub: user.id, role: user.role }, '1h');
        const refreshToken = await AuthService.generateToken({ sub: user.id, role: user.role }, '1d');

        setAuthCookies(res, authToken, refreshToken);

        return res.status(201).json({
            message: 'User created successfully',
            data: {
                id: user.id,
                role: user.role
            }
        });
    },
    async login(req: Request, res: Response) {
        const body = req.body;
        const user = await AuthService.login(body);
        const authToken = await AuthService.generateToken({ sub: user.id, role: user.role }, '1h');
        const refreshToken = await AuthService.generateToken({ sub: user.id, role: user.role }, '1d');

        setAuthCookies(res, authToken, refreshToken);

        return res.status(200).json({
            message: 'User logged in successfully',
            data: {
                id: user.id,
                role: user.role
            }
        });
    }
}