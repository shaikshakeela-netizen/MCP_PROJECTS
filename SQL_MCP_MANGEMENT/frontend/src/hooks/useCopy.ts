import { useCallback, useEffect, useRef, useState } from 'react';

export function useCopy(resetAfterMs = 1500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), resetAfterMs);
      } catch {
        setCopied(false);
      }
    },
    [resetAfterMs],
  );

  return { copied, copy };
}
