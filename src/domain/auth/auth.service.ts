import { config } from "../../config/env";
import { Role } from "../../config/role.enum";
import { BadRequestError, NotFoundError } from "../../errors/domain-errors.base";
import logger from "../../lib/logger.lib";
import { prisma } from "../../lib/prisma.lib";
import { LoginPayloadDto, RegisterPayloadDto } from "./auth.schemas";
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
            throw new BadRequestError('User already exists');
        }

        const hashedPassword = await hash(payload.password, config.bcrypt.saltRounds);
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
            throw new BadRequestError('Invalid credentials');
        }

        const isPasswordValid = await compare(payload.password, user.password);

        if (!isPasswordValid) {
            throw new BadRequestError('Invalid credentials');
        }

        return user
    },

    async generateToken(payload: { sub: string; role?: string }, expiresIn: SignOptions['expiresIn'] = '1h') {
        return jwt.sign(
            payload,
            config.jwt.secret,
            { expiresIn } as SignOptions
        );
    },

}