import dotenv from 'dotenv';
import { nodeEnv, NodeEnv, numberEnv, required } from './env.helper';

dotenv.config();

type IConfig = {
    server: {
        port: number;
        nodeEnv: NodeEnv;
        corsOrigin: string;
    },
    redis: {
        port: number
    },
    database: {
        url: string
    },
    jwt: {
        secret: string
    },
    bcrypt: {
        saltRounds: number
    }
}


export const config: IConfig = {
    server: {
        port: numberEnv('PORT', 3000),
        nodeEnv: nodeEnv(),
        corsOrigin: process.env.CORS_ORIGIN || '*'
    },
    redis: {
        port: numberEnv('REDIS_PORT', 6379)
    },
    database: {
        url: required('DATABASE_URL')
    },
    jwt: {
        secret: required('JWT_SECRET')
    },
    bcrypt: {
        saltRounds: numberEnv('BCRYPT_SALT_ROUNDS', 12)
    }
};
