import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('error', (err) => console.error('Redis error', err));

export const CacheKeys = {
  agentList:     (userId: string)  => `via:agents:user:${userId}`,
  agent:         (agentId: string) => `via:agent:${agentId}`,
  templates:     ()                => `via:templates:list`,
  analyticsSummary: (userId: string, qs: string) => `via:analytics:summary:${userId}:${qs}`,
  analyticsTs:   (userId: string, qs: string)    => `via:analytics:ts:${userId}:${qs}`,
} as const;

export const TTL = {
  AGENT_LIST: 300,
  AGENT:      300,
  TEMPLATES:  3600,
  ANALYTICS:  60,
} as const;

export async function invalidateAgent(userId: string, agentId: string): Promise<void> {
  await redis.del(CacheKeys.agentList(userId), CacheKeys.agent(agentId));
}
