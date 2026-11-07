import { Trophy } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ToolSource } from '@/components/ui/ToolSource';
import type { Customer } from '@/types';
import { cn } from '@/utils/cn';
import { formatInteger } from '@/utils/format';

interface TopCustomersProps {
  customers: Customer[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  title?: string;
  description?: string;
}

function RankMark({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
        rank === 1 && 'bg-indigo-600 text-white',
        rank === 2 && 'bg-indigo-200 text-indigo-900',
        rank === 3 && 'bg-indigo-100 text-indigo-800',
        rank > 3 && 'text-slate-500',
      )}
    >
      {rank}
    </span>
  );
}

export function TopCustomers({
  customers,
  loading,
  error,
  onRetry,
  title = 'Top customers',
  description = 'Ranked by total orders.',
}: TopCustomersProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader title={title} description={description} />
      <div className="flex-1">
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : !customers || customers.length === 0 ? (
          <EmptyState icon={Trophy} title="No customers yet" description="Customers appear here once the table has rows." />
        ) : (
          <table className="w-full text-sm" aria-label={title}>
            <thead className="sr-only">
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Customer and city</th>
                <th scope="col">Total orders</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={customer.id} className="border-b border-line/70 last:border-0">
                  <td className="w-12 py-3 pl-5">
                    <RankMark rank={index + 1} />
                  </td>
                  <td className="py-3 pr-2">
                    <p className="font-medium text-ink">{customer.name ?? 'Unnamed'}</p>
                    <p className="text-xs text-slate-500">{customer.city ?? 'No city'}</p>
                  </td>
                  <td className="py-3 pr-5 text-right font-semibold tabular-nums text-ink">
                    {formatInteger(customer.total_orders ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="border-t border-line px-5 py-3">
        <ToolSource tool="get_top_customers" />
      </div>
    </Card>
  );
}
