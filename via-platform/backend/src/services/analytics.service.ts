import { analyticsRepository } from '../repositories/analytics.repository';
import { redis, CacheKeys, TTL } from '../config/redis';
import type { AnalyticsQuery, AnalyticsSummary, AnalyticsDataPoint } from '../types';

export const analyticsService = {
  async getSummary(userId: string, query: AnalyticsQuery): Promise<AnalyticsSummary> {
    const key = CacheKeys.analyticsSummary(userId, JSON.stringify(query));
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as AnalyticsSummary;

    const data = await analyticsRepository.getSummary(userId, query);
    await redis.setex(key, TTL.ANALYTICS, JSON.stringify(data));
    return data;
  },

  async getTimeSeries(userId: string, query: AnalyticsQuery): Promise<AnalyticsDataPoint[]> {
    const key = CacheKeys.analyticsTs(userId, JSON.stringify(query));
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as AnalyticsDataPoint[];

    const data = await analyticsRepository.getTimeSeries(userId, query);
    await redis.setex(key, TTL.ANALYTICS, JSON.stringify(data));
    return data;
  },
};
