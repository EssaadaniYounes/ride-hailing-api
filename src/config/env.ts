import dotenv from 'dotenv';
import { nodeEnv, NodeEnv, numberEnv, required } from './env.helper';

dotenv.config();

type IConfig = {
    server: {
        port: number;
        nodeEnv: NodeEnv;
    },
    redis: {
        port: number
    },
    database: {
        url: string
    },
    jwt: {
        secret: string
    }
}


export const config: IConfig = {
    server: {
        port: numberEnv('PORT', 3000),
        nodeEnv: nodeEnv()
    },
    redis:{
        port: numberEnv('REDIS_PORT', 6379)
    },
    database: {
        url: required('DATABASE_URL')
    },
    jwt: {
        secret: required('JWT_SECRET')
    }
};
