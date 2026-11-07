import { useCallback, useState } from 'react';
import type { HistoryEntry } from '@/types';

// Only the SQL text, time, status and row count are stored. Result rows are never saved.
const STORAGE_KEY = 'sql-mcp-studio.history.v1';
const MAX_ENTRIES = 100;

function isEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.query === 'string' &&
    typeof entry.ranAt === 'string' &&
    (entry.status === 'success' || entry.status === 'error')
  );
}

function read(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage can be full or blocked; history is a convenience, so ignore.
  }
}

export function useQueryHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(read);

  const update = useCallback((change: (current: HistoryEntry[]) => HistoryEntry[]) => {
    setEntries((current) => {
      const next = change(current);
      write(next);
      return next;
    });
  }, []);

  const add = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'ranAt'>) => {
      const created: HistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ranAt: new Date().toISOString(),
      };
      update((current) => [created, ...current].slice(0, MAX_ENTRIES));
    },
    [update],
  );

  const remove = useCallback((id: string) => update((current) => current.filter((entry) => entry.id !== id)), [update]);
  const clear = useCallback(() => update(() => []), [update]);

  return { entries, add, remove, clear };
}
