import Redis from "ioredis";
import { config } from "../config/env";
export let redis: Redis;
export function createRedis() {
    if (redis) return redis;
    redis = new Redis({
        port: config.redis.port,
        password: config.redis.password,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    });
    return redis;
}
createRedis();