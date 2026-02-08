import { config } from "../../config/env";
import { Role } from "../../config/role.enum";
import { BadRequestError, NotFoundError } from "../../errors/domain-errors.base";
import logger from "../../lib/logger.lib";
import { prisma } from "../../lib/prisma.lib";
import { LoginPayloadDto, RegisterPayloadDto } from "./auth.types";
import { compare, hash } from "bcrypt";
import jwt, { SignOptions } from 'jsonwebtoken';
export const AuthService = {
    async register(payload: RegisterPayloadDto) {
        logger.info(`Registering user ${payload.email}`);
        const userExist = await prisma.user.count({
            where: {
                email: payload.email
            }
        });

        if (userExist) {
            throw new BadRequestError('User already exist');
        }
        if (!payload.password) {
            throw new BadRequestError('Password is required');
        }
        if (!payload.email) {
            throw new BadRequestError('Email is required');
        }
        if (![Role.DRIVER, Role.USER].includes(payload.role)) {
            throw new BadRequestError('Invalid role, must be USER or DRIVER');
        }
        const hashedPassword = await hash(payload.password, 10);
        const user = await prisma.user.create({
            data: {
                email: payload.email,
                password: hashedPassword,
                role: payload.role,
            }
        });
        logger.info(`User ${payload.email} registered successfully`);
        return user
    },

    async login(payload: LoginPayloadDto) {
        logger.info(`Logging in user ${payload.email}`);
        const user = await prisma.user.findUnique({
            where: {
                email: payload.email
            }
        });
        if (!user) {
            throw new NotFoundError("Invalid email!");
        }

        const isItSamePassword = await compare(payload.password, user.password);

        if (!isItSamePassword) {
            throw new BadRequestError("Invalid password!");
        }
        return user
    },

    async generateToken<T extends { id: string }>(user: T, expiresIn: SignOptions['expiresIn'] = '1h') {
        return jwt.sign(
            user,
            config.jwt.secret,
            { expiresIn } as SignOptions
        );
    },

}