'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { AutopilotFlow } from '@/components/agents/AutopilotFlow';
import { CopilotFlow } from '@/components/agents/CopilotFlow';
import { TemplateGallery } from '@/components/agents/TemplateGallery';

type Mode = 'autopilot' | 'copilot' | 'template';

const MODES: { id: Mode; icon: string; label: string; tag?: string; desc: string; color: string }[] = [
  {
    id: 'autopilot',
    icon: '⚡',
    label: 'Autopilot',
    tag: 'Fastest',
    desc: 'Describe your use case in plain English. Claude generates a complete, production-ready agent in seconds.',
    color: 'from-brand-500 to-violet-500',
  },
  {
    id: 'copilot',
    icon: '🧭',
    label: 'Copilot',
    desc: 'Walk through a guided step-by-step builder. You stay in control of every detail.',
    color: 'from-sky-500 to-blue-600',
  },
  {
    id: 'template',
    icon: '📋',
    label: 'Templates',
    desc: 'Start from a proven template for support, sales, healthcare, or scheduling. Customize as needed.',
    color: 'from-emerald-500 to-teal-600',
  },
];

export default function NewAgentPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Mode | null>(null);

  if (selected === 'autopilot') return <AutopilotFlow onBack={() => setSelected(null)} />;
  if (selected === 'copilot')   return <CopilotFlow   onBack={() => setSelected(null)} />;
  if (selected === 'template')  return <TemplateGallery onBack={() => setSelected(null)} />;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 animate-fade-in">
      {/* Header */}
      <button onClick={() => router.back()} className="text-xs text-gray-400 hover:text-gray-600 mb-10 transition-colors">
        ← Back to agents
      </button>

      <div className="text-center mb-10 max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-3">
          New Agent
        </p>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
          How do you want to create your agent?
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Choose the creation mode that fits your workflow. You can always switch later.
        </p>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        {MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setSelected(mode.id)}
            className={cn(
              'group relative text-left rounded-2xl border border-gray-100 bg-white p-6',
              'shadow-card hover:shadow-card-hover hover:border-gray-200',
              'transition-all duration-200 focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            )}
          >
            {mode.tag && (
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full border border-brand-200">
                {mode.tag}
              </span>
            )}

            {/* Icon */}
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5',
              'bg-gradient-to-br', mode.color, 'shadow-sm',
            )}>
              {mode.icon}
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-2">{mode.label}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{mode.desc}</p>

            <div className={cn(
              'mt-5 flex items-center gap-1 text-xs font-semibold transition-colors',
              'text-gray-400 group-hover:text-brand-600',
            )}>
              Get started <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
