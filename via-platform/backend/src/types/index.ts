// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id:        string;
  email:     string;
  fullName:  string | null;
  plan:      string;
  createdAt: string;
}

// ── Agent ─────────────────────────────────────────────────────────────────────
export type AgentMode   = 'autopilot' | 'copilot' | 'template';
export type AgentStatus = 'draft' | 'active' | 'paused' | 'archived';
export type LLMModel    = 'claude-3-5-sonnet-20241022' | 'claude-3-haiku-20240307';

export interface AgentVariable {
  id:           string;
  agentId:      string;
  variableKey:  string;
  description:  string | null;
  defaultValue: string | null;
  createdAt:    string;
}

export interface Agent {
  id:             string;
  userId:         string;
  name:           string;
  slug:           string;
  mode:           AgentMode;
  status:         AgentStatus;
  systemPrompt:   string;
  firstMessage:   string;
  voiceId:        string | null;
  language:       string;
  llmModel:       LLMModel;
  llmTemperature: number;
  llmMaxTokens:   number;
  templateId:     string | null;
  metadata:       Record<string, unknown>;
  variables:      AgentVariable[];
  createdAt:      string;
  updatedAt:      string;
}

export interface CreateAgentDto {
  name:            string;
  mode:            AgentMode;
  systemPrompt?:   string;
  firstMessage?:   string;
  voiceId?:        string;
  language?:       string;
  llmModel?:       LLMModel;
  llmTemperature?: number;
  llmMaxTokens?:   number;
  templateId?:     string;
}

export interface UpdateAgentDto {
  name?:           string;
  status?:         AgentStatus;
  systemPrompt?:   string;
  firstMessage?:   string;
  voiceId?:        string;
  language?:       string;
  llmModel?:       LLMModel;
  llmTemperature?: number;
  llmMaxTokens?:   number;
}

// ── Template ──────────────────────────────────────────────────────────────────
export type TemplateCategory = 'support' | 'sales' | 'scheduling' | 'billing' | 'custom';

export interface AgentTemplate {
  id:           string;
  name:         string;
  slug:         string;
  category:     TemplateCategory;
  description:  string;
  systemPrompt: string;
  firstMessage: string;
  language:     string;
  llmModel:     string;
  previewTags:  string[];
  iconEmoji:    string;
  isFeatured:   boolean;
  createdAt:    string;
}

// ── Call ──────────────────────────────────────────────────────────────────────
export type CallDirection = 'inbound' | 'outbound';
export type CallStatus    = 'ringing' | 'connected' | 'ended' | 'failed';

export interface Call {
  id:               string;
  userId:           string;
  agentId:          string;
  agentName:        string;
  direction:        CallDirection;
  status:           CallStatus;
  fromNumber:       string;
  toNumber:         string;
  durationSecs:     number | null;
  elevenLabsCallId: string | null;
  twilioCallSid:    string | null;
  costCredits:      number | null;
  llmCostUsd:       number | null;
  recordingUrl:     string | null;
  transcript:       string | null;
  metadata:         Record<string, unknown>;
  startedAt:        string;
  endedAt:          string | null;
  createdAt:        string;
}

export interface CreateCallDto {
  agentId:    string;
  direction:  CallDirection;
  fromNumber: string;
  toNumber:   string;
}

export interface EndCallDto {
  durationSecs?: number;
  costCredits?:  number;
  llmCostUsd?:   number;
  recordingUrl?: string;
  transcript?:   string;
  status?:       CallStatus;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface AnalyticsSummary {
  totalCalls:       number;
  avgDurationSecs:  number;
  totalCostCredits: number;
  avgCostCredits:   number;
  totalLlmCostUsd:  number;
  avgLlmCostUsd:    number;
}

export interface AnalyticsDataPoint {
  date:      string;
  callCount: number;
}

export interface AnalyticsQuery {
  from?:        string;
  to?:          string;
  granularity?: 'day' | 'week';
  agentId?:     string;
}

// ── Autopilot ─────────────────────────────────────────────────────────────────
export interface AutopilotGenerateDto {
  industry: string;
  role:     string;
  tone:     string;
  goals:    string[];
}

export interface AutopilotResult {
  systemPrompt: string;
  firstMessage: string;
  tone:         string;
  useCase:      string;
}
