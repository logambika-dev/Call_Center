'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { templates as templatesApi, agents, getToken } from '@/lib/api-client';
import type { AgentTemplate } from '@via/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TEMPLATE_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Props { onBack: () => void }

const categoryColor: Record<string, string> = {
  support:     'bg-blue-50 text-blue-700',
  sales:       'bg-green-50 text-green-700',
  healthcare:  'bg-rose-50 text-rose-700',
  collections: 'bg-orange-50 text-orange-700',
  scheduling:  'bg-violet-50 text-violet-700',
};

export function TemplateGallery({ onBack }: Props) {
  const router = useRouter();
  const [list, setList]         = useState<AgentTemplate[]>([]);
  const [filtered, setFiltered] = useState<AgentTemplate[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<AgentTemplate | null>(null);
  const [agentName, setAgentName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    templatesApi.list().then(t => { setList(t); setFiltered(t); setLoading(false); });
  }, []);

  useEffect(() => {
    let result = list;
    if (category)    result = result.filter(t => t.category === category);
    if (search.trim()) result = result.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [category, search, list]);

  async function useTemplate() {
    if (!selected || !agentName.trim()) return;
    setCreating(true);
    try {
      const agent = await agents.fromTemplate(selected.id, agentName, getToken() ?? '');
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed'); setCreating(false);
    }
  }

  // ── Preview panel ────────────────────────────────────────────────────────
  if (selected) return (
    <div className="flex-1 flex flex-col items-center justify-start px-6 py-10 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl">
        <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600 mb-8 transition-colors">
          ← Back to templates
        </button>

        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl shrink-0 shadow-card">
            {selected.iconEmoji}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
              {selected.isFeatured && <Badge variant="brand">Featured</Badge>}
            </div>
            <p className="text-sm text-gray-500">{selected.description}</p>
            <div className="flex gap-1.5 mt-2">
              {selected.previewTags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-7">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">System Prompt Preview</label>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed max-h-60 overflow-y-auto font-mono whitespace-pre-wrap">
              {selected.systemPrompt}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">First Message</label>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
              {selected.firstMessage}
            </div>
          </div>
        </div>

        <Input
          label="Agent Name"
          placeholder={selected.name}
          value={agentName}
          onChange={e => setAgentName(e.target.value)}
          hint="You can always rename later"
        />

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
          <Button variant="primary" size="lg" className="flex-1" loading={creating}
            disabled={!agentName.trim()} onClick={useTemplate}>
            Use this template →
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Gallery ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col px-6 py-10 animate-fade-in overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto">
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 mb-8 transition-colors">
          ← Back
        </button>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">Templates</p>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Start from a proven template</h2>
          <p className="text-sm text-gray-500">Pre-built configurations for the most common call center use cases.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex gap-1.5">
            {TEMPLATE_CATEGORIES.map(c => (
              <button key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  category === c.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
                )}>
                {c.label}
              </button>
            ))}
          </div>
          <Input placeholder="Search templates…" value={search}
            onChange={e => setSearch(e.target.value)} className="w-48 h-8 text-xs" />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card animate-pulse h-44" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <button key={t.id} onClick={() => { setSelected(t); setAgentName(t.name); }}
                className={cn(
                  'group text-left bg-white rounded-2xl border border-gray-100 p-5 shadow-card',
                  'hover:border-gray-200 hover:shadow-card-hover transition-all duration-150',
                )}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shadow-sm">
                    {t.iconEmoji}
                  </div>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-md', categoryColor[t.category] ?? 'bg-gray-100 text-gray-600')}>
                    {t.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{t.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{t.description}</p>
                <div className="flex gap-1 mt-3 flex-wrap">
                  {t.previewTags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
                <p className="mt-4 text-xs font-semibold text-gray-400 group-hover:text-brand-600 transition-colors">
                  Use template →
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
