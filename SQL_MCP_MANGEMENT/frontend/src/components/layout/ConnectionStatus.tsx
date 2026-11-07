import { useStudio, type ConnectionState } from '@/context/StudioContext';
import { cn } from '@/utils/cn';

const labels: Record<ConnectionState, { text: string; dot: string; ring: string }> = {
  checking: { text: 'Checking connection', dot: 'bg-slate-400 animate-pulse', ring: 'ring-slate-200 text-slate-600' },
  connected: { text: 'MCP connected', dot: 'bg-emerald-500', ring: 'ring-emerald-200 text-emerald-800' },
  degraded: { text: 'MCP unavailable', dot: 'bg-amber-500', ring: 'ring-amber-200 text-amber-800' },
  offline: { text: 'API unreachable', dot: 'bg-red-500', ring: 'ring-red-200 text-red-800' },
};

export function ConnectionStatus() {
  const { connection } = useStudio();
  const label = labels[connection];
  return (
    <span
      role="status"
      className={cn('inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-inset', label.ring)}
    >
      <span className={cn('h-2 w-2 rounded-full', label.dot)} aria-hidden />
      <span className="hidden sm:inline">{label.text}</span>
      <span className="sr-only sm:hidden">{label.text}</span>
    </span>
  );
}
