import { extractVariables } from '../utils/variableParser';
import { agentRepository } from '../repositories/agent.repository';
import { redis, CacheKeys, TTL, invalidateAgent } from '../config/redis';
import type { Agent, CreateAgentDto, UpdateAgentDto } from '../types';

export const agentService = {
  async list(userId: string): Promise<Agent[]> {
    const key = CacheKeys.agentList(userId);
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as Agent[];

    const agents = await agentRepository.findAllByUser(userId);
    await redis.setex(key, TTL.AGENT_LIST, JSON.stringify(agents));
    return agents;
  },

  async get(agentId: string, userId: string): Promise<Agent | null> {
    const key = CacheKeys.agent(agentId);
    const cached = await redis.get(key);
    if (cached) {
      const agent = JSON.parse(cached) as Agent;
      if (agent.userId !== userId) return null;
      return agent;
    }
    const agent = await agentRepository.findById(agentId, userId);
    if (agent) await redis.setex(key, TTL.AGENT, JSON.stringify(agent));
    return agent;
  },

  async create(userId: string, dto: CreateAgentDto): Promise<Agent> {
    const variables = extractVariables(dto.systemPrompt ?? '');
    const agent = await agentRepository.create(userId, dto, variables);
    await redis.del(CacheKeys.agentList(userId));
    return agent;
  },

  async update(agentId: string, userId: string, dto: UpdateAgentDto): Promise<Agent | null> {
    const variables = dto.systemPrompt !== undefined
      ? extractVariables(dto.systemPrompt)
      : undefined;
    const agent = await agentRepository.update(agentId, userId, dto, variables);
    if (agent) await invalidateAgent(userId, agentId);
    return agent;
  },

  async archive(agentId: string, userId: string): Promise<boolean> {
    const deleted = await agentRepository.archive(agentId, userId);
    if (deleted) await invalidateAgent(userId, agentId);
    return deleted;
  },
};
