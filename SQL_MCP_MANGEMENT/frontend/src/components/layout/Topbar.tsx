import { ChevronRight, Database, Menu, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStudio } from '@/context/StudioContext';
import { pageTitle } from '@/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { ConnectionStatus } from './ConnectionStatus';

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { pathname } = useLocation();
  const { health, refresh, connection } = useStudio();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-sm">
            <li className="hidden text-slate-500 sm:block">SQL MCP Studio</li>
            <li className="hidden text-slate-300 sm:block" aria-hidden>
              <ChevronRight className="h-4 w-4" />
            </li>
            <li className="truncate font-semibold text-ink" aria-current="page">
              {pageTitle(pathname)}
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {health && (
          <span className="hidden items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 md:inline-flex">
            <Database className="h-3.5 w-3.5" aria-hidden />
            {health.database_type}
          </span>
        )}
        <ConnectionStatus />
        <Button size="sm" onClick={refresh} aria-label="Refresh data">
          <RefreshCw className={cn('h-4 w-4', connection === 'checking' && 'animate-spin motion-reduce:animate-none')} aria-hidden />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </header>
  );
}
