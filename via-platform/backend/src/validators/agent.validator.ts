import { z } from 'zod';

const llmModels = ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] as const;
const modes     = ['autopilot', 'copilot', 'template'] as const;
const statuses  = ['draft', 'active', 'paused', 'archived'] as const;

export const createAgentSchema = z.object({
  name:            z.string().min(1).max(255),
  mode:            z.enum(modes),
  systemPrompt:    z.string().optional(),
  firstMessage:    z.string().optional(),
  voiceId:         z.string().optional(),
  language:        z.string().default('en'),
  llmModel:        z.enum(llmModels).optional(),
  llmTemperature:  z.number().min(0).max(1).optional(),
  llmMaxTokens:    z.number().int().min(64).max(4096).optional(),
  templateId:      z.string().uuid().optional(),
});

export const updateAgentSchema = z.object({
  name:            z.string().min(1).max(255).optional(),
  status:          z.enum(statuses).optional(),
  systemPrompt:    z.string().optional(),
  firstMessage:    z.string().optional(),
  voiceId:         z.string().optional(),
  language:        z.string().optional(),
  llmModel:        z.enum(llmModels).optional(),
  llmTemperature:  z.number().min(0).max(1).optional(),
  llmMaxTokens:    z.number().int().min(64).max(4096).optional(),
});

export const autopilotGenerateSchema = z.object({
  industry: z.string().min(1),
  role:     z.string().min(1),
  tone:     z.string().min(1),
  goals:    z.array(z.string()).min(1),
});
