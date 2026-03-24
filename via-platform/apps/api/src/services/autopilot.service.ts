import { Response } from 'express';
import { anthropic, DEFAULT_MODEL } from '../config/anthropic';
import { redis, CacheKeys, TTL } from '../config/redis';
import type { AutopilotGenerateDto, AutopilotResult } from '@via/shared';

const SYSTEM_INSTRUCTION = `You are an expert AI agent designer specializing in call center voice agents.
When given a description of a business use case, you generate professional, production-ready agent configurations.

Output ONLY a valid JSON object — no markdown, no prose, no code fences.
The JSON must have exactly these keys:
- system_prompt: string (detailed behavioral instructions for the AI agent, 150-300 words)
- first_message: string (the exact opening line the agent speaks, 1-2 sentences, warm and professional)
- tone: string (one of: professional, friendly, empathetic, assertive, casual)
- use_case: string (a concise 5-10 word description of the agent's purpose)

Include {{variable}} placeholders where appropriate (e.g. {{company_name}}, {{agent_name}}, {{customer_name}}).
Make the system_prompt rich, specific, and production-quality.`;

export const autopilotService = {
  /** Stream a Claude-generated agent config as SSE to the response. */
  async generateStream(
    userId: string,
    dto: AutopilotGenerateDto,
    res: Response,
  ): Promise<void> {
    // Redis lock — prevent duplicate concurrent generation per user
    const lockKey = CacheKeys.autopilotLock(userId);
    const locked = await redis.set(lockKey, '1', 'EX', TTL.LOCK, 'NX');
    if (!locked) {
      res.write('event: error\ndata: {"message":"A generation is already in progress"}\n\n');
      res.end();
      return;
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const userPrompt = [
      `Industry: ${dto.industry}`,
      `Agent Role: ${dto.role}`,
      `Desired Tone: ${dto.tone}`,
      `Goals: ${dto.goals.join(', ')}`,
    ].join('\n');

    let fullText = '';

    try {
      const stream = anthropic.messages.stream({
        model: DEFAULT_MODEL,
        max_tokens: 1024,
        system: SYSTEM_INSTRUCTION,
        messages: [{ role: 'user', content: userPrompt }],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          const token = chunk.delta.text;
          fullText += token;
          // Stream each token to client
          res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
        }
      }

      // Parse and validate final JSON
      const result = parseAutopilotResult(fullText);
      res.write(`event: complete\ndata: ${JSON.stringify(result)}\n\n`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    } finally {
      await redis.del(lockKey);
      res.end();
    }
  },

  /** Non-streaming: refine an existing prompt with feedback. */
  async refine(systemPrompt: string, feedback: string): Promise<AutopilotResult> {
    const message = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_INSTRUCTION,
      messages: [
        {
          role: 'user',
          content: `Here is an existing agent system prompt:\n\n${systemPrompt}\n\nUser feedback: ${feedback}\n\nGenerate an improved version.`,
        },
      ],
    });

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    return parseAutopilotResult(text);
  },
};

function parseAutopilotResult(raw: string): AutopilotResult {
  // Strip possible markdown code fences
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    return {
      systemPrompt: String(parsed.system_prompt ?? ''),
      firstMessage: String(parsed.first_message ?? ''),
      tone:         String(parsed.tone ?? 'professional'),
      useCase:      String(parsed.use_case ?? ''),
    };
  } catch {
    throw new Error(`Claude returned invalid JSON. Raw: ${raw.slice(0, 200)}`);
  }
}
