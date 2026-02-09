import dotenv from 'dotenv';

dotenv.config();

const NODE_ENVS = ['development', 'staging', 'production'] as const;
export type NodeEnv = typeof NODE_ENVS[number];


export function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function numberEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for env var: ${key}`);
  }
  return parsed;
}

export function booleanEnv(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;

  const normalized = value.toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;

  throw new Error(`Invalid boolean for env var: ${key}`);
}

export function nodeEnv(): NodeEnv {
  const env = process.env.NODE_ENV ?? 'development';
  if (!NODE_ENVS.includes(env as NodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${env}`);
  }
  return env as NodeEnv;
}
