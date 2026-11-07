import { Check, Copy, History, Play, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { useCopy } from '@/hooks/useCopy';
import { useQueryHistory } from '@/hooks/useQueryHistory';
import type { HistoryEntry } from '@/types';
import { formatDateTime } from '@/utils/format';

interface ItemProps {
  entry: HistoryEntry;
  onRerun: () => void;
  onRemove: () => void;
}

function HistoryItem({ entry, onRerun, onRemove }: ItemProps) {
  const { copied, copy } = useCopy();
  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <time dateTime={entry.ranAt} className="text-slate-600">
          {formatDateTime(entry.ranAt)}
        </time>
        {entry.status === 'success' ? (
          <Badge tone="success">
            {entry.rowCount ?? 0} {entry.rowCount === 1 ? 'row' : 'rows'}
          </Badge>
        ) : (
          <Badge tone="danger">Failed</Badge>
        )}
      </div>
      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-md bg-navy-900 px-3.5 py-3 font-mono text-[13px] leading-relaxed text-slate-200">
        {entry.query}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={onRerun}>
          <Play className="h-3.5 w-3.5" aria-hidden />
          Re-run
        </Button>
        <Button size="sm" onClick={() => void copy(entry.query)}>
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove} aria-label="Remove this query from history">
          <X className="h-3.5 w-3.5" aria-hidden />
          Remove
        </Button>
      </div>
    </li>
  );
}

export function HistoryPage() {
  const { entries, remove, clear } = useQueryHistory();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? entries.filter((entry) => entry.query.toLowerCase().includes(term)) : entries;
  }, [entries, search]);

  const rerun = (entry: HistoryEntry) => navigate('/playground', { state: { query: entry.query, autorun: true } });

  const confirmClear = () => {
    if (window.confirm('Clear all saved queries? This cannot be undone.')) clear();
  };

  return (
    <PageContainer
      title="Query History"
      description="Queries you ran in the playground, saved in this browser only. Only the SQL, time and row count are stored, never the result data."
      actions={
        entries.length > 0 ? (
          <Button variant="danger" onClick={confirmClear}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Clear history
          </Button>
        ) : undefined
      }
    >
      <Card>
        {entries.length === 0 ? (
          <EmptyState
            icon={History}
            title="No queries yet"
            description="Queries you run in the SQL Playground will be listed here so you can run them again."
            action={
              <Button variant="primary" size="sm" onClick={() => navigate('/playground')}>
                Open SQL Playground
              </Button>
            }
          />
        ) : (
          <>
            <div className="border-b border-line px-5 py-3">
              <label className="relative block max-w-sm">
                <span className="sr-only">Search query history</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search saved queries"
                  className="h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm placeholder:text-slate-400"
                />
              </label>
            </div>
            {visible.length === 0 ? (
              <EmptyState icon={Search} title="No matching queries" description={`Nothing in your history contains “${search}”.`} />
            ) : (
              <ul className="divide-y divide-line">
                {visible.map((entry) => (
                  <HistoryItem key={entry.id} entry={entry} onRerun={() => rerun(entry)} onRemove={() => remove(entry.id)} />
                ))}
              </ul>
            )}
          </>
        )}
      </Card>
    </PageContainer>
  );
}
