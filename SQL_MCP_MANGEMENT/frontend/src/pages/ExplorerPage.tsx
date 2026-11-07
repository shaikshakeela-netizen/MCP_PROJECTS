import { Database, Table2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { SchemaTable } from '@/components/database/SchemaTable';
import { TableList } from '@/components/database/TableList';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ToolSource } from '@/components/ui/ToolSource';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import { cn } from '@/utils/cn';
import { formatInteger } from '@/utils/format';

type Tab = 'schema' | 'data';
const PREVIEW_ROWS = 100;

export function ExplorerPage() {
  const tables = useApi(api.tables);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('schema');

  // Pick the first table once the list loads, or when the selected one disappears.
  useEffect(() => {
    if (!tables.data) return;
    if (selected === null || !tables.data.includes(selected)) {
      setSelected(tables.data[0] ?? null);
    }
  }, [tables.data, selected]);

  const schema = useApi(() => api.tableSchema(selected as string), [selected], selected !== null);
  const rows = useApi(() => api.tableRows(selected as string, PREVIEW_ROWS), [selected, tab], selected !== null && tab === 'data');

  return (
    <PageContainer
      title="Database Explorer"
      description="Browse tables, inspect their columns and preview rows. Everything here is read-only."
    >
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <TableList
          tables={tables.data}
          loading={tables.loading}
          error={tables.error}
          selected={selected}
          onSelect={setSelected}
          onRetry={tables.reload}
        />

        <Card className="min-w-0">
          {selected === null ? (
            <EmptyState icon={Database} title="Select a table" description="Choose a table on the left to see its schema and rows." />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 pt-4">
                <div className="flex items-center gap-3 pb-3">
                  <Table2 className="h-5 w-5 text-indigo-600" aria-hidden />
                  <h2 className="text-[15px] font-semibold text-ink">{selected}</h2>
                  {schema.data?.row_count != null && (
                    <Badge>{formatInteger(schema.data.row_count)} rows</Badge>
                  )}
                </div>
                <div role="tablist" aria-label="Table views" className="flex gap-1">
                  {(['schema', 'data'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      id={`tab-${value}`}
                      aria-selected={tab === value}
                      aria-controls="explorer-panel"
                      onClick={() => setTab(value)}
                      className={cn(
                        '-mb-px border-b-2 px-3 pb-3 text-sm font-medium',
                        tab === value ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-ink',
                      )}
                    >
                      {value === 'schema' ? 'Schema' : 'Data'}
                    </button>
                  ))}
                </div>
              </div>

              <div id="explorer-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
                {tab === 'schema' ? (
                  schema.loading ? (
                    <div className="space-y-3 p-5">
                      {[0, 1, 2, 3].map((index) => (
                        <Skeleton key={index} className="h-9 w-full" />
                      ))}
                    </div>
                  ) : schema.error ? (
                    <ErrorState message={schema.error} onRetry={schema.reload} />
                  ) : schema.data && schema.data.columns.length > 0 ? (
                    <SchemaTable columns={schema.data.columns} />
                  ) : (
                    <EmptyState icon={Table2} title="No columns" description="This table has no columns to show." />
                  )
                ) : rows.loading ? (
                  <div className="space-y-3 p-5">
                    {[0, 1, 2, 3].map((index) => (
                      <Skeleton key={index} className="h-9 w-full" />
                    ))}
                  </div>
                ) : rows.error ? (
                  <ErrorState message={rows.error} onRetry={rows.reload} />
                ) : rows.data && rows.data.rows.length > 0 ? (
                  <>
                    {rows.data.truncated && (
                      <p className="border-b border-line bg-amber-50 px-5 py-2 text-sm text-amber-900">
                        Showing the first {rows.data.limit} rows only.
                      </p>
                    )}
                    <DataTable key={selected} rows={rows.data.rows} label={`Rows of ${selected}`} />
                  </>
                ) : (
                  <EmptyState icon={Table2} title="This table is empty" description="No rows were returned for this table." />
                )}
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line px-5 py-3">
                <ToolSource tool="describe_table" />
                <ToolSource tool="run_sql_query" />
              </div>
            </>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
