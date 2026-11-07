import { Card } from '@/components/ui/Card';
import { CountUp } from '@/components/ui/CountUp';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { ToolSource } from '@/components/ui/ToolSource';
import type { CustomerSummary } from '@/types';

interface KpiCardsProps {
  summary: CustomerSummary | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function KpiCards({ summary, loading, error, onRetry }: KpiCardsProps) {
  if (error) {
    return (
      <Card>
        <ErrorState message={error} onRetry={onRetry} />
      </Card>
    );
  }

  const items = [
    { label: 'Total customers', value: summary?.total_customers, decimals: 0, note: 'Rows in the customers table' },
    { label: 'Total orders', value: summary?.total_orders, decimals: 0, note: 'Sum of orders across all customers' },
    { label: 'Average orders per customer', value: summary?.average_orders, decimals: 1, note: 'Mean of total_orders' },
    { label: 'Highest orders', value: summary?.highest_orders, decimals: 0, note: 'Most orders by a single customer' },
  ];

  return (
    <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="flex flex-col p-5">
          <p className="text-sm text-slate-600">{item.label}</p>
          <div className="mt-2 h-9">
            {loading || item.value === undefined ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-ink">
                <CountUp value={item.value} decimals={item.decimals} />
              </p>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{item.note}</p>
          <div className="mt-4 border-t border-line pt-3">
            <ToolSource tool="get_customer_summary" />
          </div>
        </Card>
      ))}
    </section>
  );
}
