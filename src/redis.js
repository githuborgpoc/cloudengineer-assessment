import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379',
});

redisClient.connect().catch((err) => console.error('Redis connection error:', err));

redisClient.on('error', (err) => console.error('Redis error:', err));

export const redisConection =  redisClient;
