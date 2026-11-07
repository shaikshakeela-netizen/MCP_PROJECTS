import { CheckCircle2, Info, SearchCheck } from 'lucide-react';
import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge, type Tone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ToolSource } from '@/components/ui/ToolSource';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import type { QualitySummary, Row } from '@/types';
import { formatInteger } from '@/utils/format';

interface Check {
  key: keyof QualitySummary;
  label: string;
  explanation: string;
  severity: 'warning' | 'danger';
  /** Read-only query that lists the affected rows. */
  inspectSql: string;
}

const CHECKS: Check[] = [
  {
    key: 'missing_names',
    label: 'Missing customer names',
    explanation: 'The name is empty or only spaces.',
    severity: 'warning',
    inspectSql: "SELECT * FROM customers WHERE name IS NULL OR TRIM(name) = ''",
  },
  {
    key: 'missing_cities',
    label: 'Missing cities',
    explanation: 'The city is empty or only spaces. These customers show as “Unknown” in city totals.',
    severity: 'warning',
    inspectSql: "SELECT * FROM customers WHERE city IS NULL OR TRIM(city) = ''",
  },
  {
    key: 'missing_order_counts',
    label: 'Missing order counts',
    explanation: 'total_orders is NULL, so the customer is left out of averages.',
    severity: 'warning',
    inspectSql: 'SELECT * FROM customers WHERE total_orders IS NULL',
  },
  {
    key: 'negative_order_counts',
    label: 'Negative order counts',
    explanation: 'total_orders is below zero, which is not a valid count.',
    severity: 'danger',
    inspectSql: 'SELECT * FROM customers WHERE total_orders < 0',
  },
];

function InspectPanel({ check, onClose }: { check: Check; onClose: () => void }) {
  const result = useApi(() => api.runQuery(check.inspectSql), [check.key]);
  return (
    <Card>
      <CardHeader
        title={`Affected rows: ${check.label.toLowerCase()}`}
        action={
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        }
      />
      {result.loading ? (
        <div className="p-5">
          <Skeleton className="h-16 w-full" />
        </div>
      ) : result.error ? (
        <ErrorState message={result.error} onRetry={result.reload} />
      ) : (
        <DataTable rows={(result.data?.rows ?? []) as Row[]} columns={result.data?.columns} label={check.label} />
      )}
      <div className="border-t border-line px-5 py-3">
        <ToolSource tool="run_sql_query" />
      </div>
    </Card>
  );
}

export function QualityPage() {
  const quality = useApi(api.quality);
  const [inspecting, setInspecting] = useState<Check | null>(null);

  const summary = quality.data?.summary;
  const duplicates = quality.data?.duplicates ?? [];

  const issueCount = summary
    ? CHECKS.filter((check) => summary[check.key] > 0).length + (duplicates.length > 0 ? 1 : 0)
    : 0;

  return (
    <PageContainer
      title="Data Quality"
      description="Checks the customers table for missing values, invalid order counts and possible duplicates."
    >
      {quality.error ? (
        <Card>
          <ErrorState message={quality.error} onRetry={quality.reload} />
        </Card>
      ) : (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            {quality.loading || !summary ? (
              <Skeleton className="h-10 w-72" />
            ) : (
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    issueCount === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {issueCount === 0 ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : <SearchCheck className="h-5 w-5" aria-hidden />}
                </span>
                <div>
                  <p className="font-semibold text-ink">
                    {issueCount === 0 ? 'No issues found' : `${issueCount} ${issueCount === 1 ? 'check needs' : 'checks need'} attention`}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatInteger(summary.total_records)} {summary.total_records === 1 ? 'record' : 'records'} checked
                  </p>
                </div>
              </div>
            )}
            <ToolSource tool="check_customer_data_quality" />
          </Card>

          <section aria-label="Checks" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CHECKS.map((check) => {
              const count = summary?.[check.key];
              const clear = count === 0;
              const tone: Tone = count === undefined ? 'neutral' : clear ? 'success' : check.severity;
              return (
                <Card key={check.key} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{check.label}</p>
                    {count !== undefined && (
                      <Badge tone={tone} dot>
                        {clear ? 'Clear' : check.severity === 'danger' ? 'Invalid' : 'Review'}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 h-9">
                    {count === undefined ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-semibold tabular-nums tracking-tight text-ink">{formatInteger(count)}</p>
                    )}
                  </div>
                  <p className="mt-2 flex-1 text-sm text-slate-600">{check.explanation}</p>
                  {count !== undefined && count > 0 && (
                    <Button size="sm" className="mt-4 self-start" onClick={() => setInspecting(check)}>
                      View rows
                    </Button>
                  )}
                </Card>
              );
            })}
          </section>

          {inspecting && <InspectPanel check={inspecting} onClose={() => setInspecting(null)} />}

          <Card>
            <CardHeader
              title="Possible duplicate customers"
              description="Groups of customers that share the same name and city."
            />
            <div className="flex items-start gap-2.5 border-b border-line bg-indigo-50/60 px-5 py-3 text-sm text-indigo-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                This is a heuristic. Names and cities are compared after trimming spaces and ignoring case, so two
                different people who share both would also appear here. Treat each group as a lead to check, not a
                confirmed duplicate.
              </p>
            </div>
            {quality.loading ? (
              <div className="p-5">
                <Skeleton className="h-16 w-full" />
              </div>
            ) : duplicates.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No possible duplicates"
                description="No two customers share the same name and city."
              />
            ) : (
              <DataTable
                rows={duplicates.map((group) => ({ ...group }))}
                columns={['name', 'city', 'duplicate_count']}
                label="Possible duplicate customers"
              />
            )}
            <div className="border-t border-line px-5 py-3">
              <ToolSource tool="find_duplicate_customers" />
            </div>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
