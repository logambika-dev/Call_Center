import { templateRepository } from '../repositories/template.repository';
import { redis, CacheKeys, TTL } from '../config/redis';
import type { AgentTemplate } from '../types';

export const templateService = {
  async list(category?: string): Promise<AgentTemplate[]> {
    if (!category) {
      const cached = await redis.get(CacheKeys.templates());
      if (cached) return JSON.parse(cached) as AgentTemplate[];
    }

    const templates = await templateRepository.findAll(category);

    if (!category) {
      await redis.setex(CacheKeys.templates(), TTL.TEMPLATES, JSON.stringify(templates));
    }
    return templates;
  },

  async getById(id: string): Promise<AgentTemplate | null> {
    return templateRepository.findById(id);
  },
};
