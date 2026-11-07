import { AlertCircle, Table2, TerminalSquare } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { ToolSource } from '@/components/ui/ToolSource';
import type { QueryResult } from '@/types';
import { formatInteger } from '@/utils/format';

interface QueryResultsProps {
  result: QueryResult | null;
  /** Changes on every run so the table resets its sorting and filter. */
  runId: number;
  error: string | null;
  running: boolean;
}

export function QueryResults({ result, runId, error, running }: QueryResultsProps) {
  return (
    <Card aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-ink">Results</h2>
        {result && !running && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">
              {formatInteger(result.row_count)} {result.row_count === 1 ? 'row' : 'rows'}
            </Badge>
            <span
              className="text-xs tabular-nums text-slate-500"
              title="Measured from the bridge sending the query to the MCP server until it replied"
            >
              {result.duration_ms} ms round trip
            </span>
          </div>
        )}
      </div>

      {running ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
        </div>
      ) : error ? (
        <div role="alert" className="flex items-start gap-3 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink">The query did not run</p>
            <p className="mt-1 break-words font-mono text-sm text-red-800">{error}</p>
          </div>
        </div>
      ) : result === null ? (
        <EmptyState
          icon={TerminalSquare}
          title="Run a query to see results"
          description="Write a SELECT statement above, then press Run query or use Ctrl/⌘ + Enter."
        />
      ) : result.row_count === 0 ? (
        <EmptyState icon={Table2} title="No rows returned" description="The query ran successfully but matched no rows." />
      ) : (
        <>
          {result.truncated && (
            <p className="border-b border-line bg-amber-50 px-5 py-2 text-sm text-amber-900">
              Results are limited to the first {formatInteger(result.row_limit)} rows. Add a WHERE or LIMIT clause to narrow the query.
            </p>
          )}
          <DataTable key={runId} rows={result.rows} columns={result.columns} label="Query results" />
        </>
      )}

      <div className="border-t border-line px-5 py-3">
        <ToolSource tool="run_sql_query" />
      </div>
    </Card>
  );
}
