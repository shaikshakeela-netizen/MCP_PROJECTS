import { CityOrdersChart } from '@/components/analytics/CityOrdersChart';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { SystemPanel } from '@/components/dashboard/SystemPanel';
import { TopCustomers } from '@/components/dashboard/TopCustomers';
import { PageContainer } from '@/components/layout/PageContainer';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';

export function DashboardPage() {
  const summary = useApi(api.summary);
  const cities = useApi(api.cities);
  const top = useApi(() => api.topCustomers(5));

  return (
    <PageContainer
      title="Dashboard"
      description="A live summary of the customers database. Every figure comes from an MCP tool call, and the tool name is shown beneath it."
    >
      <KpiCards summary={summary.data} loading={summary.loading} error={summary.error} onRetry={summary.reload} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CityOrdersChart data={cities.data} loading={cities.loading} error={cities.error} onRetry={cities.reload} />
        </div>
        <TopCustomers customers={top.data} loading={top.loading} error={top.error} onRetry={top.reload} />
      </div>

      <SystemPanel />
    </PageContainer>
  );
}
