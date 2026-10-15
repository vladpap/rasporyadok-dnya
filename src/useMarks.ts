import {useCallback, useEffect, useState} from 'react';

import type {MarkStore} from './marks';

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

/** Marks of a set of days, keyed by calendar day. */
export type MarksByDay = ReadonlyMap<string, ReadonlySet<string>>;

/**
 * Load the marks of a set of days at once, so a summary of a week or a month can
 * show the progress of every day it lists.
 *
 * @param dayKeys Calendar days to read, as `YYYY-MM-DD`.
 * @param store Storage the marks are read from.
 * @returns Marks keyed by calendar day, empty until loading finishes.
 */
export function useRangeMarks(dayKeys: readonly string[], store: MarkStore): MarksByDay {
  const [marksByDay, setMarksByDay] = useState<MarksByDay>(() => new Map());

  // The range is identified by its days, so the effect re-runs when the range
  // changes and not on every render that builds fresh Date objects.
  const rangeKey = dayKeys.join(',');

  useEffect(() => {
    let isActive = true;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rangeKey stands for dayKeys
  }, [rangeKey, store]);

  return marksByDay;
}
