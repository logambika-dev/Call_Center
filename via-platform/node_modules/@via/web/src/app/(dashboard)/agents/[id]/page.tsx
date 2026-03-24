'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { agents, getToken } from '@/lib/api-client';
import type { Agent, UpdateAgentDto } from '@via/shared';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { LANGUAGES, LLM_MODELS, VOICE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

type Tab = 'prompt' | 'voice' | 'model' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'prompt',   label: 'Prompt' },
  { id: 'voice',    label: 'Voice & Language' },
  { id: 'model',    label: 'Model' },
  { id: 'settings', label: 'Settings' },
];

const statusOptions: { value: string; label: string }[] = [
  { value: 'draft',    label: 'Draft' },
  { value: 'active',   label: 'Active' },
  { value: 'paused',   label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

const statusColor: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600',
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused:   'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-red-50 text-red-500 border-red-200',
};

export default function AgentDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [agent, setAgent]     = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState<Tab>('prompt');
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved]     = useState(false);

  const [form, setForm] = useState<UpdateAgentDto>({});

  const load = useCallback(async () => {
    try {
      const data = await agents.get(id, getToken() ?? '');
      setAgent(data);
      setForm({
        name:           data.name,
        status:         data.status,
        systemPrompt:   data.systemPrompt,
        firstMessage:   data.firstMessage,
        voiceId:        data.voiceId ?? 'aria',
        language:       data.language,
        llmModel:       data.llmModel,
        llmTemperature: data.llmTemperature,
        llmMaxTokens:   data.llmMaxTokens,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function update<K extends keyof UpdateAgentDto>(key: K, val: UpdateAgentDto[K]) {
    setForm(p => ({ ...p, [key]: val }));
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await agents.update(id, form, getToken() ?? '');
      setAgent(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function deleteAgent() {
    if (!confirm(`Delete "${agent?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await agents.remove(id, getToken() ?? '');
      router.push('/agents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <svg className="animate-spin w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
      </svg>
    </div>
  );

  if (error && !agent) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <p className="text-sm text-red-500">{error}</p>
      <Button variant="outline" onClick={() => router.push('/agents')}>← Back to agents</Button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">

      {/* Top bar */}
      <div className="flex items-center gap-4 px-8 py-4 border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={() => router.push('/agents')}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Agents
        </button>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate">{agent?.name}</h1>
          <span className={cn(
            'text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize',
            statusColor[agent?.status ?? 'draft'] ?? 'bg-gray-100 text-gray-600 border-gray-200',
          )}>
            {agent?.status}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
          {error && <span className="text-xs text-red-500 truncate max-w-xs">{error}</span>}
          <Button variant="danger" size="sm" loading={deleting} onClick={deleteAgent}>
            Delete
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>
            Save changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-100 px-8 bg-white shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* ── Prompt tab ─────────────────────────────────────────── */}
          {tab === 'prompt' && (
            <>
              <Input
                label="Agent Name"
                value={form.name ?? ''}
                onChange={e => update('name', e.target.value)}
              />
              <Textarea
                label="System Prompt"
                rows={12}
                value={form.systemPrompt ?? ''}
                onChange={e => update('systemPrompt', e.target.value)}
                charCount={form.systemPrompt?.length}
                maxChars={10000}
                hint="Use {{variable}} for dynamic values like {{customer_name}}"
              />
              <Textarea
                label="First Message"
                rows={3}
                value={form.firstMessage ?? ''}
                onChange={e => update('firstMessage', e.target.value)}
                hint="The exact opening line your agent will speak"
              />
            </>
          )}

          {/* ── Voice tab ──────────────────────────────────────────── */}
          {tab === 'voice' && (
            <>
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
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-brand-400 to-violet-500 shrink-0">
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
            </>
          )}

          {/* ── Model tab ──────────────────────────────────────────── */}
          {tab === 'model' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">AI Model</label>
                <div className="space-y-2">
                  {LLM_MODELS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => update('llmModel', m.value as UpdateAgentDto['llmModel'])}
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
                        m.badge === 'Recommended'   ? 'bg-brand-50 text-brand-700 border border-brand-200' :
                        m.badge === 'Most capable'  ? 'bg-violet-50 text-violet-700 border border-violet-200' :
                                                      'bg-amber-50 text-amber-700 border border-amber-200',
                      )}>
                        {m.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Temperature</label>
                  <span className="text-xs font-semibold text-brand-600 tabular-nums">
                    {(form.llmTemperature ?? 0.7).toFixed(1)}
                  </span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={form.llmTemperature ?? 0.7}
                  onChange={e => update('llmTemperature', parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Precise (0.0)</span><span>Creative (1.0)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Max Tokens</label>
                <input
                  type="number" min="256" max="8192" step="256"
                  value={form.llmMaxTokens ?? 1024}
                  onChange={e => update('llmMaxTokens', parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 hover:border-gray-300"
                />
                <p className="text-xs text-gray-400">Maximum tokens in the model response (256–8192)</p>
              </div>
            </>
          )}

          {/* ── Settings tab ───────────────────────────────────────── */}
          {tab === 'settings' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map(s => (
                    <button
                      key={s.value}
                      onClick={() => update('status', s.value as UpdateAgentDto['status'])}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all',
                        form.status === s.value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 bg-white hover:border-gray-300',
                      )}
                    >
                      <p className="text-sm font-semibold text-gray-900 capitalize">{s.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Agent Info</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>ID</span>
                    <span className="font-mono text-gray-700">{agent?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slug</span>
                    <span className="font-mono text-gray-700">{agent?.slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode</span>
                    <span className="capitalize text-gray-700">{agent?.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="text-gray-700">{agent ? new Date(agent.createdAt).toLocaleString() : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated</span>
                    <span className="text-gray-700">{agent ? new Date(agent.updatedAt).toLocaleString() : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Danger zone</p>
                <p className="text-xs text-red-500 mb-3">Permanently delete this agent. This action cannot be undone.</p>
                <Button variant="danger" size="sm" loading={deleting} onClick={deleteAgent}>
                  Delete agent
                </Button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
