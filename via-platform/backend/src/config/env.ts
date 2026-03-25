import { z } from 'zod';

const schema = z.object({
  NODE_ENV:                    z.enum(['development', 'production', 'test']).default('development'),
  PORT:                        z.string().default('4000').transform(Number),
  DATABASE_URL:                z.string().url(),
  DATABASE_POOL_MIN:           z.string().default('2').transform(Number),
  DATABASE_POOL_MAX:           z.string().default('10').transform(Number),
  REDIS_URL:                   z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET:           z.string().min(32),
  JWT_REFRESH_SECRET:          z.string().min(32),
  JWT_ACCESS_TTL:              z.string().default('15m'),
  JWT_REFRESH_TTL:             z.string().default('7d'),
  CORS_ORIGINS:                z.string().default('http://localhost:3000'),
  // Twilio
  TWILIO_ACCOUNT_SID:          z.string().optional(),
  TWILIO_AUTH_TOKEN:           z.string().optional(),
  TWILIO_FROM_NUMBER:          z.string().optional(),
  // ElevenLabs (used by ai-service, forwarded here for webhook routing)
  ELEVENLABS_DEFAULT_AGENT_ID: z.string().optional(),
  // AI service internal URL
  AI_SERVICE_URL:              z.string().default('http://localhost:5000'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
