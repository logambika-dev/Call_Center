import { z } from 'zod';

export const createAgentSchema = z.object({
  name:           z.string().min(1).max(255),
  mode:           z.enum(['autopilot', 'copilot', 'template']),
  systemPrompt:   z.string().max(10_000).optional(),
  firstMessage:   z.string().max(2000).optional(),
  voiceId:        z.string().max(100).optional(),
  language:       z.string().length(2).optional().default('en'),
  llmModel:       z.enum(['claude-3-5-sonnet-20241022','claude-3-haiku-20240307','claude-opus-4-6']).optional(),
  llmTemperature: z.number().min(0).max(1).optional(),
  llmMaxTokens:   z.number().int().min(256).max(4096).optional(),
  templateId:     z.string().uuid().optional(),
});

export const updateAgentSchema = z.object({
  name:           z.string().min(1).max(255).optional(),
  status:         z.enum(['draft','active','paused','archived']).optional(),
  systemPrompt:   z.string().max(10_000).optional(),
  firstMessage:   z.string().max(2000).optional(),
  voiceId:        z.string().max(100).nullable().optional(),
  language:       z.string().length(2).optional(),
  llmModel:       z.enum(['claude-3-5-sonnet-20241022','claude-3-haiku-20240307','claude-opus-4-6']).optional(),
  llmTemperature: z.number().min(0).max(1).optional(),
  llmMaxTokens:   z.number().int().min(256).max(4096).optional(),
});

export const autopilotGenerateSchema = z.object({
  industry: z.string().min(2).max(100),
  role:     z.string().min(2).max(100),
  tone:     z.enum(['professional','friendly','empathetic','assertive','casual']),
  goals:    z.array(z.string().min(1).max(200)).min(1).max(5),
});
