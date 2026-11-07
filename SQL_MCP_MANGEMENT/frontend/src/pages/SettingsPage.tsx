import { Loader2, RefreshCw } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { useStudio } from '@/context/StudioContext';
import { useApi } from '@/hooks/useApi';
import { useQueryHistory } from '@/hooks/useQueryHistory';
import { api, errorMessage } from '@/services/api';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 py-3 last:border-0">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

export function SettingsPage() {
  const { health, connection, reconnect } = useStudio();
  const tools = useApi(api.tools);
  const tables = useApi(api.tables);
  const { entries, clear } = useQueryHistory();

  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectMessage, setReconnectMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleReconnect = async () => {
    setReconnecting(true);
    setReconnectMessage(null);
    try {
      await reconnect();
      setReconnectMessage({ ok: true, text: 'Reconnected to the MCP server.' });
    } catch (error) {
      setReconnectMessage({ ok: false, text: errorMessage(error) });
    } finally {
      setReconnecting(false);
    }
  };

  const connectionBadge =
    connection === 'connected' ? (
      <Badge tone="success" dot>Connected</Badge>
    ) : connection === 'checking' ? (
      <Badge>Checking</Badge>
    ) : connection === 'degraded' ? (
      <Badge tone="warning" dot>Not connected</Badge>
    ) : (
      <Badge tone="danger" dot>Unreachable</Badge>
    );

  return (
    <PageContainer title="Settings" description="Connection status and system information for this workspace.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Connection" description="Browser → bridge API → MCP server → SQLite." />
          <dl className="px-5">
            <Field label="Bridge API">
              {connection === 'offline' ? <Badge tone="danger" dot>Unreachable</Badge> : <Badge tone="success" dot>Reachable</Badge>}
            </Field>
            <Field label="MCP server">{connectionBadge}</Field>
            <Field label="Server name">{health?.server_name ?? '—'}</Field>
            <Field label="Database">{health?.database_type ?? '—'}</Field>
            {health?.mcp_error && <Field label="Last error">{health.mcp_error}</Field>}
          </dl>
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
            <Button variant="primary" onClick={handleReconnect} disabled={reconnecting || connection === 'offline'}>
              {reconnecting ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
              Reconnect
            </Button>
            {reconnectMessage && (
              <p role="status" className={`text-sm ${reconnectMessage.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                {reconnectMessage.text}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Database" description="Tables available through the list_tables tool." />
          <div className="p-5">
            {tables.loading ? (
              <Skeleton className="h-10 w-full" />
            ) : tables.error ? (
              <ErrorState message={tables.error} onRetry={tables.reload} />
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold tabular-nums text-ink">{tables.data?.length ?? 0}</span>{' '}
                  {tables.data?.length === 1 ? 'table' : 'tables'}
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {(tables.data ?? []).map((name) => (
                    <li key={name} className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                      {name}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-5 text-sm text-slate-600">
              Read-only access is enforced inside the MCP server: the database is opened in read-only mode and every
              query passes a SQLite authorizer that rejects anything except reads.
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="MCP tools" description="Tools the connected server exposes." />
          {tools.loading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : tools.error ? (
            <ErrorState message={tools.error} onRetry={tools.reload} />
          ) : (
            <ul className="divide-y divide-line/70">
              {(tools.data ?? []).map((tool) => (
                <li key={tool.name} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-baseline sm:gap-6">
                  <code className="w-64 shrink-0 font-mono text-[13px] font-medium text-indigo-700">{tool.name}</code>
                  <span className="text-sm text-slate-600">{tool.description || 'No description provided.'}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Application" />
          <dl className="px-5">
            <Field label="Frontend version">{__APP_VERSION__}</Field>
            <Field label="API address">{import.meta.env.VITE_API_URL || 'Same origin (/api)'}</Field>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Local data" description="Stored in this browser only." />
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-slate-600">
              <span className="font-semibold tabular-nums text-ink">{entries.length}</span> saved{' '}
              {entries.length === 1 ? 'query' : 'queries'}
            </p>
            <Button
              variant="danger"
              size="sm"
              disabled={entries.length === 0}
              onClick={() => {
                if (window.confirm('Clear all saved queries? This cannot be undone.')) clear();
              }}
            >
              Clear query history
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
