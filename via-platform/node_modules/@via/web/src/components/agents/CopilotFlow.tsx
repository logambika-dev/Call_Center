'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { agents, getToken } from '@/lib/api-client';
import { LANGUAGES, LLM_MODELS, VOICE_OPTIONS, AGENT_TONES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Props { onBack: () => void }

interface StepConfig {
  id: number;
  title: string;
  desc: string;
}

const STEPS: StepConfig[] = [
  { id: 1, title: 'Name your agent',    desc: 'Give your agent an identity' },
  { id: 2, title: 'System prompt',      desc: 'Define behaviour and instructions' },
  { id: 3, title: 'First message',      desc: 'What your agent says first' },
  { id: 4, title: 'Voice & language',   desc: 'How your agent sounds' },
  { id: 5, title: 'Model settings',     desc: 'Configure the AI model' },
];

export function CopilotFlow({ onBack }: Props) {
  const router = useRouter();
  const [step, setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError]  = useState('');

  const [form, setForm] = useState({
    name:           '',
    systemPrompt:   '',
    firstMessage:   '',
    voiceId:        'aria',
    language:       'en',
    llmModel:       'claude-3-5-sonnet-20241022',
    llmTemperature: 0.7,
    llmMaxTokens:   1024,
  });

  function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(p => ({ ...p, [key]: val }));
  }

  function canNext(): boolean {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.systemPrompt.trim().length > 10;
    if (step === 3) return form.firstMessage.trim().length > 0;
    return true;
  }

  async function finish() {
    setSaving(true);
    try {
      const agent = await agents.create({ ...form, mode: 'copilot' }, getToken() ?? '');
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-6 py-12 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl">

        {/* Back */}
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 mb-10 transition-colors">
          ← Back
        </button>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map(s => (
            <div
              key={s.id}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                s.id < step  ? 'bg-brand-600' :
                s.id === step? 'bg-brand-400' :
                               'bg-gray-100',
              )}
            />
          ))}
        </div>

        {/* Step header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1">
            Step {step} of {STEPS.length}
          </p>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{STEPS[step-1].title}</h2>
          <p className="text-sm text-gray-500 mt-1">{STEPS[step-1].desc}</p>
        </div>

        {/* Step content */}
        <div className="animate-slide-up">
          {step === 1 && (
            <Input
              label="Agent Name"
              placeholder="e.g. Aria, Nova, Support Pro"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              hint="This is how your agent will identify itself"
              autoFocus
            />
          )}

          {step === 2 && (
            <Textarea
              label="System Prompt"
              placeholder={`You are ${form.name || 'an AI assistant'}. Your role is to…`}
              rows={10}
              value={form.systemPrompt}
              onChange={e => update('systemPrompt', e.target.value)}
              charCount={form.systemPrompt.length}
              maxChars={10000}
              hint="Use {{variable}} for dynamic values like {{customer_name}}, {{company_name}}"
            />
          )}

          {step === 3 && (
            <Textarea
              label="First Message"
              placeholder={`Hello! I'm ${form.name || 'your assistant'}. How can I help you today?`}
              rows={4}
              value={form.firstMessage}
              onChange={e => update('firstMessage', e.target.value)}
              hint="The exact opening line your agent will speak"
            />
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Voice</label>
                <div className="grid grid-cols-2 gap-2">
                  {VOICE_OPTIONS.map(v => (
                    <button
                      key={v.id}
                      onClick={() => update('voiceId', v.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                        form.voiceId === v.id
                          ? 'border-brand-500 bg-brand-50 shadow-focus'
                          : 'border-gray-200 bg-white hover:border-gray-300',
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0',
                        'bg-gradient-to-br from-brand-400 to-violet-500',
                      )}>
                        {v.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                        <p className="text-xs text-gray-400">{v.accent} · {v.style}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Language</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.value}
                      onClick={() => update('language', l.value)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                        form.language === l.value
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
                      )}
                    >
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">AI Model</label>
                <div className="space-y-2">
                  {LLM_MODELS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => update('llmModel', m.value)}
                      className={cn(
                        'w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all',
                        form.llmModel === m.value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 bg-white hover:border-gray-300',
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{m.value}</p>
                      </div>
                      <span className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        m.badge === 'Recommended' ? 'bg-brand-50 text-brand-700 border border-brand-200' :
                        m.badge === 'Most capable'? 'bg-violet-50 text-violet-700 border border-violet-200' :
                                                    'bg-amber-50 text-amber-700 border border-amber-200',
                      )}>
                        {m.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Temperature</label>
                  <span className="text-xs font-semibold text-brand-600 tabular-nums">{form.llmTemperature.toFixed(1)}</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={form.llmTemperature}
                  onChange={e => update('llmTemperature', parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Precise (0.0)</span><span>Creative (1.0)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-5 text-sm text-red-500">{error}</p>}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <Button variant="outline" size="lg" onClick={() => setStep(s => s - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length ? (
            <Button variant="primary" size="lg" className="flex-1" disabled={!canNext()} onClick={() => setStep(s => s + 1)}>
              Continue →
            </Button>
          ) : (
            <Button variant="primary" size="lg" className="flex-1" loading={saving} onClick={finish}>
              Create agent →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
