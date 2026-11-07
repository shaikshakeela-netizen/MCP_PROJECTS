import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ToolSource } from '@/components/ui/ToolSource';
import type { CityOrders } from '@/types';
import { formatInteger } from '@/utils/format';

interface CityOrdersChartProps {
  data: CityOrders[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function CityTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: CityOrders }> }) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-pop">
      <p className="font-semibold text-ink">{item.city}</p>
      <p className="mt-1 text-slate-600">
        <span className="tabular-nums font-medium text-ink">{formatInteger(item.total_orders)}</span> orders
      </p>
      <p className="text-slate-600">
        <span className="tabular-nums font-medium text-ink">{formatInteger(item.total_customers)}</span>{' '}
        {item.total_customers === 1 ? 'customer' : 'customers'}
      </p>
    </div>
  );
}

export function CityOrdersChart({ data, loading, error, onRetry }: CityOrdersChartProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader title="Orders by city" description="Total orders placed by customers in each city." />
      <div className="flex-1 p-5">
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : !data || data.length === 0 ? (
          <EmptyState icon={BarChart3} title="No city data yet" description="Add customers with a city to see order totals here." />
        ) : (
          <div role="img" aria-label={`Bar chart of total orders for ${data.length} cities`} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid vertical={false} stroke="#E8EBF3" />
                <XAxis dataKey="city" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip content={<CityTooltip />} cursor={{ fill: '#EEF2FF' }} />
                <Bar dataKey="total_orders" fill="#4F46E5" radius={[5, 5, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="border-t border-line px-5 py-3">
        <ToolSource tool="get_city_order_summary" />
      </div>
    </Card>
  );
}
