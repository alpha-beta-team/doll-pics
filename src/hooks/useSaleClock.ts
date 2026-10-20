import { useEffect, useState } from 'react';

/** Expire public promotion even when a boundary refresh fails. */
export function useSaleClock(enabled: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (!enabled) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [enabled]);
  return now;
}
