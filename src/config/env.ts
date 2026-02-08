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
        port: number;
        password?: string;
    },
    database: {
        url: string
    },
    jwt: {
        secret: string
    },
    bcrypt: {
        saltRounds: number
    },
    rides: {
        maxAllowedRequestForUser: number,
        mapBoxApiKey: string,
        mapBoxBaseURL: string,
        pricePerMeter: number
    }
}


export const config: IConfig = {
    server: {
        port: numberEnv('PORT', 3000),
        nodeEnv: nodeEnv(),
        corsOrigin: process.env.CORS_ORIGIN || '*'
    },
    redis: {
        port: numberEnv('REDIS_PORT', 6379),
        password: process.env.REDIS_PASSWORD
    },
    database: {
        url: required('DATABASE_URL')
    },
    jwt: {
        secret: required('JWT_SECRET')
    },
    bcrypt: {
        saltRounds: numberEnv('BCRYPT_SALT_ROUNDS', 12)
    },
    rides: {
        maxAllowedRequestForUser: numberEnv('MAX_ALLOWED_REQUEST_FOR_USER', 3),
        mapBoxApiKey: required('MAP_BOX_KEY'),
        mapBoxBaseURL: 'https://api.mapbox.com/directions-matrix',
        pricePerMeter: numberEnv('PRICE_PER_METER', 0.1)
    }
};
