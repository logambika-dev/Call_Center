'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { streamAutopilot, agents, getToken } from '@/lib/api-client';
import { AGENT_TONES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { AutopilotResult } from '@via/shared';

interface Props { onBack: () => void }

export function AutopilotFlow({ onBack }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'generating' | 'review'>('form');
  const [form, setForm]   = useState({ industry: '', role: '', tone: 'professional', goals: '' });
  const [result, setResult] = useState<AutopilotResult | null>(null);
  const [tokens, setTokens] = useState('');
  const [agentName, setAgentName] = useState('');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const streamRef = useRef('');

  async function generate() {
    if (!form.industry.trim() || !form.role.trim()) return;
    setStep('generating');
    setTokens('');
    streamRef.current = '';

    try {
      const res = await streamAutopilot(
        {
          industry: form.industry,
          role:     form.role,
          tone:     form.tone as never,
          goals:    form.goals.split('\n').filter(Boolean),
        },
        getToken() ?? '',
        (token) => {
          streamRef.current += token;
          setTokens(prev => prev + token);
        },
      );
      setResult(res);
      setAgentName(`${form.role} Agent`);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setStep('form');
    }
  }

  async function save() {
    if (!result || !agentName.trim()) return;
    setSaving(true);
    try {
      const agent = await agents.create({
        name:         agentName,
        mode:         'autopilot',
        systemPrompt: result.systemPrompt,
        firstMessage: result.firstMessage,
      }, getToken() ?? '');
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  if (step === 'form') return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 animate-fade-in">
      <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 mb-10 transition-colors self-start max-w-lg w-full mx-auto">
        ← Back
      </button>
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border border-brand-200">
            <span>⚡</span> Autopilot — AI-powered generation
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Tell us about your agent</h2>
          <p className="text-sm text-gray-500">Claude will generate a complete, production-ready configuration.</p>
        </div>

        <div className="space-y-5">
          <Input
            label="Industry / Business"
            placeholder="e.g. Telecom, Healthcare, E-commerce, SaaS"
            value={form.industry}
            onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
            hint="The industry your company or product operates in"
          />
          <Input
            label="Agent Role"
            placeholder="e.g. Customer Support Agent, Sales Rep, Appointment Scheduler"
            value={form.role}
            onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            hint="What does this agent do?"
          />

          {/* Tone selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Tone</label>
            <div className="flex gap-2 flex-wrap">
              {AGENT_TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(p => ({ ...p, tone: t.value }))}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    form.tone === t.value
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Goals (one per line)"
            placeholder={"Resolve customer issues on first call\nReduce average handle time\nIncrease CSAT score"}
            rows={4}
            value={form.goals}
            onChange={e => setForm(p => ({ ...p, goals: e.target.value }))}
            hint="What should this agent achieve?"
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <div className="mt-7 flex gap-3">
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            disabled={!form.industry.trim() || !form.role.trim()}
            onClick={generate}
          >
            <span>⚡</span> Generate agent
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Generating ───────────────────────────────────────────────────────────
  if (step === 'generating') return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 animate-fade-in">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
            <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Generating your agent…</p>
            <p className="text-xs text-gray-400">Claude is crafting a production-ready configuration</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-5 min-h-[200px] font-mono text-sm text-green-400 leading-relaxed whitespace-pre-wrap overflow-auto max-h-80 shadow-lg">
          {tokens || <span className="animate-pulse opacity-60">Waiting for response…</span>}
          {tokens && <span className="animate-pulse">▌</span>}
        </div>
      </div>
    </div>
  );

  // ── Review ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col items-center justify-start px-6 py-10 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-600 mb-1">✓ Generated</p>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Review your agent</h2>
          </div>
          <button onClick={() => setStep('form')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Regenerate
          </button>
        </div>

        <div className="space-y-5">
          <Input
            label="Agent Name"
            value={agentName}
            onChange={e => setAgentName(e.target.value)}
            placeholder="Name your agent"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">System Prompt</label>
            <div className="relative">
              <Textarea
                rows={8}
                value={result?.systemPrompt ?? ''}
                onChange={e => setResult(p => p ? { ...p, systemPrompt: e.target.value } : p)}
                charCount={result?.systemPrompt.length}
                maxChars={10000}
              />
            </div>
          </div>

          <Textarea
            label="First Message"
            rows={3}
            value={result?.firstMessage ?? ''}
            onChange={e => setResult(p => p ? { ...p, firstMessage: e.target.value } : p)}
          />

          <div className="flex gap-3 pt-1 pb-2 border-t border-gray-100">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-brand-400"></span>
              Tone: <strong className="text-gray-600 capitalize">{result?.tone}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Use case: <strong className="text-gray-600">{result?.useCase}</strong>
            </span>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" size="lg" onClick={onBack}>Cancel</Button>
          <Button variant="primary" size="lg" className="flex-1" loading={saving} onClick={save}>
            Save & open editor →
          </Button>
        </div>
      </div>
    </div>
  );
}
