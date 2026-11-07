import { useEffect, useRef, useState } from 'react';
import { useStudio } from '@/context/StudioContext';
import { errorMessage } from '@/services/api';

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Runs `fetcher` on mount, whenever `deps` change, when the global refresh button
 * is pressed, and when `reload()` is called. Set `enabled` to false to wait.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: readonly unknown[] = [], enabled = true) {
  const { refreshKey } = useStudio();
  const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: enabled });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, error: errorMessage(error), loading: false });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, tick, enabled, ...deps]);

  return { ...state, reload: () => setTick((value) => value + 1) };
}
