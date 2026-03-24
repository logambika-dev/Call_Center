import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('error', (err) => console.error('Redis error', err));

export const CacheKeys = {
  agentList: (userId: string)    => `via:agents:user:${userId}`,
  agent:     (agentId: string)   => `via:agent:${agentId}`,
  templates: ()                   => `via:templates:list`,
  autopilotLock: (userId: string) => `via:autopilot:lock:${userId}`,
  rateLimit: (userId: string, group: string) => `via:ratelimit:${userId}:${group}`,
} as const;

export const TTL = {
  AGENT_LIST:  300,   // 5 min
  AGENT:       300,
  TEMPLATES:   3600,  // 1 hour
  LOCK:        30,
} as const;

export async function invalidateAgent(userId: string, agentId: string): Promise<void> {
  await redis.del(CacheKeys.agentList(userId), CacheKeys.agent(agentId));
}
