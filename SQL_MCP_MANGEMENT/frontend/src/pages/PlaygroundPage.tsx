import { Check, Copy, Eraser, Loader2, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { QueryResults } from '@/components/sql-editor/QueryResults';
import { SqlEditor } from '@/components/sql-editor/SqlEditor';
import { Button } from '@/components/ui/Button';
import { useCopy } from '@/hooks/useCopy';
import { useQueryHistory } from '@/hooks/useQueryHistory';
import { api, errorMessage } from '@/services/api';
import type { QueryResult } from '@/types';

const DEFAULT_QUERY = 'SELECT * FROM customers;';

const EXAMPLES = [
  { label: 'All customers', sql: 'SELECT * FROM customers;' },
  {
    label: 'Orders by city',
    sql: 'SELECT city, COUNT(*) AS customers, SUM(total_orders) AS orders\nFROM customers\nGROUP BY city\nORDER BY orders DESC;',
  },
  {
    label: 'Above-average customers',
    sql: 'SELECT name, city, total_orders\nFROM customers\nWHERE total_orders > (SELECT AVG(total_orders) FROM customers)\nORDER BY total_orders DESC;',
  },
];

interface NavigationState {
  query?: string;
  autorun?: boolean;
}

export function PlaygroundPage() {
  const location = useLocation();
  const incoming = location.state as NavigationState | null;

  const [query, setQuery] = useState(incoming?.query ?? DEFAULT_QUERY);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [runId, setRunId] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const { add } = useQueryHistory();
  const { copied, copy } = useCopy();

  const queryRef = useRef(query);
  queryRef.current = query;
  const runningRef = useRef(false);

  const run = useCallback(async () => {
    const sql = queryRef.current.trim();
    if (!sql) {
      setResult(null);
      setError('Enter a SQL query before running.');
      return;
    }
    if (runningRef.current) return;

    runningRef.current = true;
    setRunning(true);
    setError(null);
    try {
      const response = await api.runQuery(sql);
      setResult(response);
      setRunId((value) => value + 1);
      add({ query: sql, status: 'success', rowCount: response.row_count });
    } catch (caught) {
      setResult(null);
      setError(errorMessage(caught));
      add({ query: sql, status: 'error' });
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }, [add]);

  // The editor registers its Ctrl/Cmd+Enter shortcut once, so give it a function that never changes.
  const runRef = useRef(run);
  runRef.current = run;
  const stableRun = useCallback(() => {
    void runRef.current();
  }, []);

  // "Re-run" from Query History opens this page with autorun set.
  useEffect(() => {
    if (incoming?.autorun) {
      window.history.replaceState({}, '');
      void runRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer
      title="SQL Playground"
      description="Write a read-only query and run it through the MCP server. Anything that would change data is rejected."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={stableRun} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            Run query
          </Button>
          <Button onClick={() => void copy(query)} disabled={!query}>
            {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? 'Copied' : 'Copy query'}
          </Button>
          <Button variant="ghost" onClick={() => setQuery('')} disabled={!query}>
            <Eraser className="h-4 w-4" aria-hidden />
            Clear
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-mono text-[11px]">Ctrl/⌘ + Enter</kbd> runs the query
        </p>
      </div>

      <SqlEditor value={query} onChange={setQuery} onRun={stableRun} />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">Examples</span>
        {EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => setQuery(example.sql)}
            className="rounded-full border border-line bg-white px-3 py-1 text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
          >
            {example.label}
          </button>
        ))}
      </div>

      <QueryResults result={result} runId={runId} error={error} running={running} />
    </PageContainer>
  );
}
