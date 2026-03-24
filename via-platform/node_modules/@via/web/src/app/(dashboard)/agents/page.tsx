'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { agents, getToken } from '@/lib/api-client';
import type { Agent } from '@via/shared';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const statusColor: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600',
  active:   'bg-emerald-50 text-emerald-700',
  paused:   'bg-amber-50 text-amber-700',
  archived: 'bg-red-50 text-red-500',
};

const modeIcon: Record<string, string> = {
  autopilot: '⚡',
  copilot:   '🧭',
  template:  '📋',
};

export default function AgentsPage() {
  const [list, setList]       = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const token = getToken() ?? '';
    agents.list(token)
      .then(setList)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load agents'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col px-8 py-10 animate-fade-in">
      <div className="max-w-5xl w-full mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-1">Agents</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your agents</h1>
          </div>
          <Link href="/agents/new">
            <Button variant="primary" size="md">+ New agent</Button>
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 mb-6">{error}</div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card animate-pulse h-20" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl mb-5 shadow-card">
              🤖
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">No agents yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Create your first AI call center agent to get started.
            </p>
            <Link href="/agents/new">
              <Button variant="primary">Create your first agent →</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map(agent => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className={cn(
                  'group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-card',
                  'hover:border-gray-200 hover:shadow-card-hover transition-all duration-150',
                )}
              >
                {/* Mode icon */}
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shrink-0 shadow-sm">
                  {modeIcon[agent.mode] ?? '🤖'}
                </div>

                {/* Name & meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{agent.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{agent.mode} · {agent.language.toUpperCase()}</p>
                </div>

                {/* Status badge */}
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full capitalize', statusColor[agent.status] ?? 'bg-gray-100 text-gray-600')}>
                  {agent.status}
                </span>

                {/* Date */}
                <p className="text-xs text-gray-400 shrink-0 hidden sm:block">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </p>

                {/* Arrow */}
                <span className="text-gray-300 group-hover:text-brand-500 transition-colors shrink-0">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
