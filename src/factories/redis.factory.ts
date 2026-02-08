import Redis from "ioredis";
import { config } from "../config/env";
let redis: Redis;
export function createRedis() {
    if (redis) return redis;
    redis = new Redis(config.redis.port);
    return redis;
}