import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-400' },
  success: { badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  warning: { badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  danger: { badge: 'bg-red-50 text-red-800 ring-red-200', dot: 'bg-red-500' },
  info: { badge: 'bg-indigo-50 text-indigo-800 ring-indigo-200', dot: 'bg-indigo-500' },
};

export function Badge({ tone = 'neutral', dot = false, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone].badge,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', tones[tone].dot)} aria-hidden />}
      {children}
    </span>
  );
}
