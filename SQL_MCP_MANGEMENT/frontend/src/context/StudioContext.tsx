import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/services/api';
import type { Health } from '@/types';

export type ConnectionState = 'checking' | 'connected' | 'degraded' | 'offline';

interface StudioContextValue {
  health: Health | null;
  connection: ConnectionState;
  /** Increments whenever the user asks for fresh data; data hooks refetch when it changes. */
  refreshKey: number;
  refresh: () => void;
  reconnect: () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    api
      .health()
      .then((result) => {
        if (cancelled) return;
        setHealth(result);
        setOffline(false);
      })
      .catch(() => {
        if (cancelled) return;
        setHealth(null);
        setOffline(true);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const reconnect = useCallback(async () => {
    try {
      await api.reconnect();
    } finally {
      setRefreshKey((key) => key + 1);
    }
  }, []);

  const connection: ConnectionState = offline
    ? 'offline'
    : checking && !health
      ? 'checking'
      : health?.mcp_connected
        ? 'connected'
        : 'degraded';

  const value = useMemo(
    () => ({ health, connection, refreshKey, refresh, reconnect }),
    [health, connection, refreshKey, refresh, reconnect],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const value = useContext(StudioContext);
  if (!value) throw new Error('useStudio must be used inside StudioProvider');
  return value;
}
