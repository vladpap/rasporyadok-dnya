import {useEffect, useState} from 'react';

/** How often the page re-reads the clock, in milliseconds. */
const DEFAULT_INTERVAL_MS = 30_000;

/**
 * Track the current time, so past segments grey out while the page stays open.
 *
 * @param intervalMs How often to re-read the clock.
 * @returns The current moment, refreshed on the interval.
 */
export function useCurrentTime(intervalMs: number = DEFAULT_INTERVAL_MS): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
