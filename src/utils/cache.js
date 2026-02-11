// src/utils/cache.js
import { createClient } from 'redis';
import { config } from '../config/index.js';

const client = createClient({ url: config.redisUrl || 'redis://localhost:6379' });
client.on('error', err => console.error('Redis error', err));
await client.connect();

export const getCache = async (key) => {
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCache = async (key, value, ttl = 3600) => { // 1 hour
  await client.set(key, JSON.stringify(value), { EX: ttl });
};

// usage:
/* const cacheKey = `feed:${req.user.id}:${page}:${limit}`;
let products = await getCache(cacheKey);
if (!products) {
  // ... compute products
  await setCache(cacheKey, products, 1800); // 30min
} */