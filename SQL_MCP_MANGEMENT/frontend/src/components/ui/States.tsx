import { AlertTriangle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">This data could not be loaded</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{message}</p>
      </div>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}
