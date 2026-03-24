export type AgentMode   = 'autopilot' | 'copilot' | 'template';
export type AgentStatus = 'draft' | 'active' | 'paused' | 'archived';
export type LLMModel    = 'claude-3-5-sonnet-20241022' | 'claude-3-haiku-20240307' | 'claude-opus-4-6';

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
  name:           string;
  mode:           AgentMode;
  systemPrompt?:  string;
  firstMessage?:  string;
  voiceId?:       string;
  language?:      string;
  llmModel?:      LLMModel;
  llmTemperature?: number;
  llmMaxTokens?:  number;
  templateId?:    string;
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

export interface AutopilotGenerateDto {
  industry: string;
  role:     string;
  tone:     string;
  goals:    string[];
}

export interface AutopilotResult {
  systemPrompt:  string;
  firstMessage:  string;
  tone:          string;
  useCase:       string;
}
