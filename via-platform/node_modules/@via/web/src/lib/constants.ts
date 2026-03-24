export const LLM_MODELS = [
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', badge: 'Recommended' },
  { value: 'claude-opus-4-6',            label: 'Claude Opus 4.6',    badge: 'Most capable' },
  { value: 'claude-3-haiku-20240307',    label: 'Claude 3 Haiku',     badge: 'Fastest' },
] as const;

export const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'tn', label: 'Tamil',   flag: '🇮🇳' },
  { value: 'fr', label: 'French',  flag: '🇫🇷' },
  { value: 'de', label: 'German',  flag: '🇩🇪' },
  { value: 'it', label: 'Italian', flag: '🇮🇹' },
  { value: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { value: 'zh', label: 'Chinese',  flag: '🇨🇳' },
  { value: 'ar', label: 'Arabic',   flag: '🇸🇦' },
  { value: 'hi', label: 'Hindi',    flag: '🇮🇳' },
] as const;

export const VOICE_OPTIONS = [
  { id: 'aria',    name: 'Aria',    accent: 'American',   style: 'Conversational' },
  { id: 'rachel',  name: 'Rachel',  accent: 'American',   style: 'Calm' },
  { id: 'daniel',  name: 'Daniel',  accent: 'British',    style: 'Professional' },
  { id: 'charlie', name: 'Charlie', accent: 'Australian', style: 'Casual' },
  { id: 'nova',    name: 'Nova',    accent: 'American',   style: 'Energetic' },
  { id: 'echo',    name: 'Echo',    accent: 'American',   style: 'Warm' },
] as const;

export const TEMPLATE_CATEGORIES = [
  { value: '',             label: 'All' },
  { value: 'support',      label: 'Customer Support' },
  { value: 'sales',        label: 'Sales' },
  { value: 'healthcare',   label: 'Healthcare' },
  { value: 'collections',  label: 'Collections' },
  { value: 'scheduling',   label: 'Scheduling' },
] as const;

export const AGENT_TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly',     label: 'Friendly' },
  { value: 'empathetic',   label: 'Empathetic' },
  { value: 'assertive',    label: 'Assertive' },
  { value: 'casual',       label: 'Casual' },
] as const;
