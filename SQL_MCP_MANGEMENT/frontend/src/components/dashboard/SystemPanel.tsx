import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useStudio } from '@/context/StudioContext';

export function SystemPanel() {
  const { health, connection } = useStudio();

  const status =
    connection === 'connected' ? (
      <Badge tone="success" dot>Connected</Badge>
    ) : connection === 'checking' ? (
      <Badge>Checking</Badge>
    ) : connection === 'degraded' ? (
      <Badge tone="warning" dot>MCP server not reachable</Badge>
    ) : (
      <Badge tone="danger" dot>Bridge API not reachable</Badge>
    );

  return (
    <Card>
      <CardHeader title="System" description="Reported by the bridge API and the MCP server." />
      <div className="grid gap-6 p-5 md:grid-cols-3">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Database</dt>
            <dd className="mt-0.5 font-medium text-ink">{health?.database_type ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Connection</dt>
            <dd className="mt-1">{status}</dd>
          </div>
        </dl>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">MCP server</dt>
            <dd className="mt-0.5 font-medium text-ink">{health?.server_name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Tools available</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-ink">{health ? health.tools.length : '—'}</dd>
          </div>
        </dl>
        <div className="text-sm">
          <p className="text-slate-500">Tool names</p>
          {connection === 'checking' ? (
            <Skeleton className="mt-2 h-16 w-full" />
          ) : health && health.tools.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {health.tools.map((tool) => (
                <li key={tool} className="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700">
                  {tool}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-slate-500">No tools reported.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
