import { Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CityOrdersChart } from '@/components/analytics/CityOrdersChart';
import { TopCustomers } from '@/components/dashboard/TopCustomers';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ToolSource } from '@/components/ui/ToolSource';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import type { Row } from '@/types';
import { formatInteger, formatPercent } from '@/utils/format';

const TOP_OPTIONS = [5, 10, 25];

export function CustomersPage() {
  const [topLimit, setTopLimit] = useState(5);
  const [cityFilter, setCityFilter] = useState('all');

  const cities = useApi(api.cities);
  const top = useApi(() => api.topCustomers(topLimit), [topLimit]);
  const customers = useApi(api.customers);

  const cityNames = useMemo(
    () => Array.from(new Set((customers.data ?? []).map((customer) => customer.city ?? 'No city'))).sort(),
    [customers.data],
  );

  const filteredRows = useMemo<Row[]>(() => {
    const all = customers.data ?? [];
    const matching = cityFilter === 'all' ? all : all.filter((customer) => (customer.city ?? 'No city') === cityFilter);
    return matching.map((customer) => ({ ...customer }));
  }, [customers.data, cityFilter]);

  const totalOrders = (cities.data ?? []).reduce((sum, city) => sum + city.total_orders, 0);

  return (
    <PageContainer
      title="Customer Analytics"
      description="How customers and orders are distributed across cities, and who orders the most."
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CityOrdersChart data={cities.data} loading={cities.loading} error={cities.error} onRetry={cities.reload} />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
            <label htmlFor="top-limit">Show top</label>
            <select
              id="top-limit"
              value={topLimit}
              onChange={(event) => setTopLimit(Number(event.target.value))}
              className="h-8 rounded-md border border-line bg-white px-2 text-sm"
            >
              {TOP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <TopCustomers
            customers={top.data}
            loading={top.loading}
            error={top.error}
            onRetry={top.reload}
            description={`The ${topLimit} customers with the most orders.`}
          />
        </div>
      </div>

      <Card>
        <CardHeader
          title="City breakdown"
          description="Share of orders is calculated in the browser from the totals returned by the tool."
        />
        {cities.loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : cities.error ? (
          <ErrorState message={cities.error} onRetry={cities.reload} />
        ) : !cities.data || cities.data.length === 0 ? (
          <EmptyState icon={Users} title="No cities to show" description="City totals appear once customers have a city." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm" aria-label="Orders by city">
              <thead>
                <tr className="border-b border-line bg-slate-50/70 text-slate-600">
                  <th scope="col" className="px-5 py-2.5 text-left font-semibold">City</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold">Customers</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold">Orders</th>
                  <th scope="col" className="px-5 py-2.5 text-left font-semibold">Share of orders</th>
                </tr>
              </thead>
              <tbody>
                {cities.data.map((city) => (
                  <tr key={city.city} className="border-b border-line/70 last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">{city.city}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatInteger(city.total_customers)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatInteger(city.total_orders)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: totalOrders > 0 ? `${(city.total_orders / totalOrders) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="tabular-nums text-slate-600">{formatPercent(city.total_orders, totalOrders)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-line px-5 py-3">
          <ToolSource tool="get_city_order_summary" />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="All customers"
          action={
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <label htmlFor="city-filter">City</label>
              <select
                id="city-filter"
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="h-8 rounded-md border border-line bg-white px-2 text-sm"
                disabled={!customers.data}
              >
                <option value="all">All cities</option>
                {cityNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          }
        />
        {customers.loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : customers.error ? (
          <ErrorState message={customers.error} onRetry={customers.reload} />
        ) : filteredRows.length === 0 ? (
          <EmptyState icon={Users} title="No customers found" description="No rows match the current city filter." />
        ) : (
          <DataTable key={cityFilter} rows={filteredRows} columns={['id', 'name', 'city', 'total_orders']} label="Customers" />
        )}
        <div className="border-t border-line px-5 py-3">
          <ToolSource tool="get_customers" />
        </div>
      </Card>
    </PageContainer>
  );
}
