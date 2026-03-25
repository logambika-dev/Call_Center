import { z } from 'zod';

const e164 = z.string().regex(/^\+[1-9]\d{7,14}$/, 'Must be E.164 format e.g. +15551234567');

export const outboundCallSchema = z.object({
  agentId:  z.string().uuid(),
  toNumber: e164,
});

export const endCallSchema = z.object({
  durationSecs: z.number().int().nonnegative().optional(),
  costCredits:  z.number().nonnegative().optional(),
  llmCostUsd:   z.number().nonnegative().optional(),
  recordingUrl: z.string().url().optional(),
  transcript:   z.string().optional(),
  status:       z.enum(['ended', 'failed']).optional(),
});
