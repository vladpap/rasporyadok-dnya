/**
 * Loading the schedule from Supabase for the views.
 *
 * The schedule is no longer a static import, so every view needs the week plus a
 * loading state and an error. This hook owns that: it fetches once, keeps the
 * result, and exposes a reload for after an edit is saved.
 */

import {useCallback, useEffect, useState} from 'react';

import type {DayKey, ScheduleDay} from './schedule';
import {fetchScheduleWeek} from './scheduleStore';

/** What the views need to render a schedule, whatever its state. */
export type ScheduleState = {
  /** The week, or null until the first load finishes. */
  week: ScheduleDay[] | null;
  /** True while a load is in flight. */
  isLoading: boolean;
  /** Message to show when the load failed, otherwise null. */
  error: string | null;
  /** Fetch the week again, for example after an edit. */
  reload: () => void;
};

/**
 * Load the schedule week once and keep it.
 *
 * @returns The week, its loading state, its error and a reload function.
 */
export function useSchedule(): ScheduleState {
  const [week, setWeek] = useState<ScheduleDay[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);

    fetchScheduleWeek()
      .then((loadedWeek) => {
        if (isActive) {
          setWeek(loadedWeek);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить расписание');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [reloadCount]);

  const reload = useCallback(() => {
    setReloadCount((current) => current + 1);
  }, []);

  return {week, isLoading, error, reload};
}

/**
 * Find one day in a loaded week.
 *
 * @param week Loaded week, or null while loading.
 * @param key Week day key.
 * @returns The day, or null when the week is not loaded yet.
 */
export function findDay(week: ScheduleDay[] | null, key: DayKey): ScheduleDay | null {
  return week?.find((day) => day.key === key) ?? null;
}
