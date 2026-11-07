import { Search, Table2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ToolSource } from '@/components/ui/ToolSource';
import { cn } from '@/utils/cn';

interface TableListProps {
  tables: string[] | null;
  loading: boolean;
  error: string | null;
  selected: string | null;
  onSelect: (name: string) => void;
  onRetry: () => void;
}

export function TableList({ tables, loading, error, selected, onSelect, onRetry }: TableListProps) {
  const [search, setSearch] = useState('');
  const visible = useMemo(
    () => (tables ?? []).filter((name) => name.toLowerCase().includes(search.trim().toLowerCase())),
    [tables, search],
  );

  return (
    <Card className="flex flex-col">
      <CardHeader title="Tables" description={tables ? `${tables.length} in this database` : undefined} />
      <div className="border-b border-line p-3">
        <label className="relative block">
          <span className="sr-only">Search tables</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tables"
            className="h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm placeholder:text-slate-400"
          />
        </label>
      </div>
      <div className="flex-1 p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Table2}
            title={search ? 'No matching tables' : 'No tables found'}
            description={search ? 'Try a different search term.' : 'The database has no user tables.'}
          />
        ) : (
          <ul className="space-y-0.5">
            {visible.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => onSelect(name)}
                  aria-current={selected === name ? 'true' : undefined}
                  className={cn(
                    'flex h-10 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm font-medium',
                    selected === name ? 'bg-indigo-50 text-indigo-800' : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <Table2 className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-line px-5 py-3">
        <ToolSource tool="list_tables" />
      </div>
    </Card>
  );
}
