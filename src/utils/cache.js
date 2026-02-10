// src/utils/cache.js
import { createClient } from 'redis';

const client = createClient({ url: config.redisUrl });
client.on('error', err => console.error('Redis error', err));
await client.connect();

export const getCache = async (key) => JSON.parse(await client.get(key));
export const setCache = async (key, value, ttl = 3600) => await client.set(key, JSON.stringify(value), { EX: ttl });