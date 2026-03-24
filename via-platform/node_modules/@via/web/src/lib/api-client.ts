import type { Agent, AgentTemplate, CreateAgentDto, UpdateAgentDto, AutopilotGenerateDto, AutopilotResult } from '@via/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface ApiSuccess<T> { success: true; data: T; meta?: Record<string, unknown> }

class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (res.status === 204) return undefined as T;
  const json = await res.json();
  if (!res.ok) throw new ApiError(res.status, json.error?.code ?? 'UNKNOWN', json.error?.message ?? 'Request failed');
  return (json as ApiSuccess<T>).data;
}

// ── Token storage (browser only) ────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('via_token');
}
export function setToken(t: string): void { localStorage.setItem('via_token', t); }
export function clearToken(): void { localStorage.removeItem('via_token'); }

// ── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  register: (email: string, password: string, fullName?: string) =>
    req<{ user: unknown; accessToken: string }>('POST', '/api/v1/auth/register', { email, password, fullName }),
  login: (email: string, password: string) =>
    req<{ user: unknown; accessToken: string }>('POST', '/api/v1/auth/login', { email, password }),
};

// ── Agents ───────────────────────────────────────────────────────────────────
export const agents = {
  list: (token: string) =>
    req<Agent[]>('GET', '/api/v1/agents', undefined, token),
  get: (id: string, token: string) =>
    req<Agent>('GET', `/api/v1/agents/${id}`, undefined, token),
  create: (dto: CreateAgentDto, token: string) =>
    req<Agent>('POST', '/api/v1/agents', dto, token),
  update: (id: string, dto: UpdateAgentDto, token: string) =>
    req<Agent>('PATCH', `/api/v1/agents/${id}`, dto, token),
  remove: (id: string, token: string) =>
    req<void>('DELETE', `/api/v1/agents/${id}`, undefined, token),
  fromTemplate: (templateId: string, name: string, token: string) =>
    req<Agent>('POST', `/api/v1/agents/from-template/${templateId}`, { name }, token),
};

// ── Templates ────────────────────────────────────────────────────────────────
export const templates = {
  list: (category?: string) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    return req<AgentTemplate[]>('GET', `/api/v1/templates${qs}`);
  },
  get: (id: string) => req<AgentTemplate>('GET', `/api/v1/templates/${id}`),
};

// ── Autopilot SSE stream ─────────────────────────────────────────────────────
export function streamAutopilot(
  dto: AutopilotGenerateDto,
  token: string,
  onToken: (t: string) => void,
): Promise<AutopilotResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(`${BASE}/api/v1/autopilot/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(dto),
      });
      if (!res.ok || !res.body) { reject(new Error('Stream failed')); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: token')) continue;
          if (line.startsWith('event: complete')) continue;
          if (line.startsWith('event: error')) continue;
          if (line.startsWith('data: ')) {
            const raw = line.slice(6);
            try {
              const parsed = JSON.parse(raw);
              if (parsed.token) { onToken(parsed.token); }
              else if (parsed.systemPrompt) { resolve(parsed as AutopilotResult); }
              else if (parsed.message) { reject(new Error(parsed.message)); }
            } catch { /* partial data */ }
          }
        }
      }
    } catch (err) { reject(err); }
  });
}
