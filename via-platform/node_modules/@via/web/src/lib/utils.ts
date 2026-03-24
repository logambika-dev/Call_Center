import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

export function statusColor(status: string): string {
  return ({
    draft:    'bg-gray-100 text-gray-600',
    active:   'bg-green-50 text-green-700',
    paused:   'bg-amber-50 text-amber-700',
    archived: 'bg-red-50 text-red-600',
  })[status] ?? 'bg-gray-100 text-gray-600';
}

export function modeIcon(mode: string): string {
  return ({ autopilot: '⚡', copilot: '🧭', template: '📋' })[mode] ?? '🤖';
}
