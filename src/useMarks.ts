import {useCallback, useEffect, useState} from 'react';

import type {MarkStore} from './marks';
import {addDays, dateKey} from './schedule';

/** Marks of one day, plus the toggle the day view needs. */
export type DayMarks = {
  doneIds: ReadonlySet<string>;
  toggle: (entryId: string) => void;
};

/**
 * Load and update the marks of one day.
 *
 * @param dayKey Calendar day the marks belong to, as `YYYY-MM-DD`.
 * @param store Storage the marks are read from and written to.
 * @returns Marked identifiers and a toggle that persists the change.
 */
export function useDayMarks(dayKey: string, store: MarkStore): DayMarks {
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(() => new Set<string>());

  useEffect(() => {
    let isActive = true;
    void store.load(dayKey).then((storedIds) => {
      if (isActive) {
        setDoneIds(new Set(storedIds));
      }
    });
    return () => {
      isActive = false;
    };
  }, [dayKey, store]);

  const toggle = useCallback(
    (entryId: string) => {
      setDoneIds((current) => {
        const next = new Set(current);
        if (next.has(entryId)) {
          next.delete(entryId);
        } else {
          next.add(entryId);
        }
        void store.save(dayKey, [...next]);
        return next;
      });
    },
    [dayKey, store],
  );

  return {doneIds, toggle};
}

/** Marks of every day of one week, keyed by calendar day. */
export type WeekMarks = ReadonlyMap<string, ReadonlySet<string>>;

/** Number of days a week view shows. */
const DAYS_PER_WEEK = 7;

/**
 * Load the marks of a whole week at once, so day rows can show their progress.
 *
 * @param weekStart Monday of the shown week.
 * @param store Storage the marks are read from.
 * @returns Marks keyed by calendar day, empty until loading finishes.
 */
export function useWeekMarks(weekStart: Date, store: MarkStore): WeekMarks {
  const [marksByDay, setMarksByDay] = useState<WeekMarks>(() => new Map());

  // The week is identified by its Monday, so the effect re-runs on a new week
  // and not on every render that builds a fresh Date object.
  const weekKey = dateKey(weekStart);

  useEffect(() => {
    let isActive = true;
    const dayKeys = Array.from({length: DAYS_PER_WEEK}, (_, index) =>
      dateKey(addDays(weekStart, index)),
    );

    void Promise.all(
      dayKeys.map(async (dayKey) => {
        const storedIds = await store.load(dayKey);
        return [dayKey, new Set(storedIds)] as const;
      }),
    ).then((entries) => {
      if (isActive) {
        setMarksByDay(new Map(entries));
      }
    });

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- weekKey stands for weekStart
  }, [weekKey, store]);

  return marksByDay;
}
