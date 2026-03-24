export type TemplateCategory =
  | 'support'
  | 'sales'
  | 'healthcare'
  | 'collections'
  | 'scheduling';

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
