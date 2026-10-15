/**
 * Reading and writing the schedule in Supabase.
 *
 * The schedule used to be a generated JSON file compiled into the bundle, which
 * meant every change needed a rebuild and a redeploy. It now lives in the
 * `schedule` table: the app reads it on start and the edit page writes to it, so
 * a change is visible on every device as soon as it is saved.
 *
 * `data/schedule.csv` is kept as the import source: `scripts/import-schedule.mjs`
 * loads it into the table once, and after that the table is the source of truth.
 */

import {
  DAY_KEYS,
  type DayKey,
  type EntryKind,
  type ScheduleDay,
  type ScheduleEntry,
} from './schedule';
import {supabase} from './supabase';

/** One row of the `schedule` table, as Supabase returns it. */
type ScheduleRow = {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  kind: string;
  icon: string;
  title: string;
  note: string;
  tracked: boolean;
  sort_order: number;
};

/** Day labels used for headings, keyed by week day. */
const DAY_LABELS: Record<DayKey, {label: string; fullLabel: string}> = {
  mon: {label: 'Пн', fullLabel: 'Понедельник'},
  tue: {label: 'Вт', fullLabel: 'Вторник'},
  wed: {label: 'Ср', fullLabel: 'Среда'},
  thu: {label: 'Чт', fullLabel: 'Четверг'},
  fri: {label: 'Пт', fullLabel: 'Пятница'},
  sat: {label: 'Сб', fullLabel: 'Суббота'},
  sun: {label: 'Вс', fullLabel: 'Воскресенье'},
};

/** Columns the app reads, so the payload stays the shape it maps from. */
const SCHEDULE_COLUMNS = 'id,day,start_time,end_time,kind,icon,title,note,tracked,sort_order';

/**
 * Turn a database row into the schedule entry the views use.
 *
 * The database enforces the same value ranges as the build script, so the casts
 * here only mirror the constraints already checked on write.
 *
 * @param row Row as Supabase returns it.
 * @returns The entry.
 */
function rowToEntry(row: ScheduleRow): ScheduleEntry {
  return {
    id: row.id,
    start: row.start_time,
    end: row.end_time,
    kind: row.kind as EntryKind,
    icon: row.icon,
    title: row.title,
    note: row.note,
    tracked: row.tracked,
  };
}

/**
 * Group flat rows into the seven days of the week, each in time order.
 *
 * Every day is returned even when the table has no rows for it, so the views can
 * render an empty day instead of failing on a missing key.
 *
 * @param rows Rows of the `schedule` table.
 * @returns The week, in display order.
 */
export function groupRowsIntoWeek(rows: ScheduleRow[]): ScheduleDay[] {
  return DAY_KEYS.map((dayKey) => ({
    key: dayKey,
    label: DAY_LABELS[dayKey].label,
    fullLabel: DAY_LABELS[dayKey].fullLabel,
    entries: rows
      .filter((row) => row.day === dayKey)
      .sort((left, right) => {
        const byStart = left.start_time.localeCompare(right.start_time);
        return byStart !== 0 ? byStart : left.sort_order - right.sort_order;
      })
      .map(rowToEntry),
  }));
}

/**
 * Read the whole schedule from Supabase.
 *
 * The whole week is fetched at once, because every view needs several days: the
 * day view one, the week view seven and the month view dozens.
 *
 * @returns The week in display order.
 * @throws Error when Supabase reports a failure, so callers can show a message.
 */
export async function fetchScheduleWeek(): Promise<ScheduleDay[]> {
  // The smoke test runs offline in jsdom, so it hands the week in directly
  // instead of reaching the network. Production never sets this.
  const injected = (globalThis as {__rasporyadokScheduleWeek?: ScheduleDay[]})
    .__rasporyadokScheduleWeek;
  if (injected) {
    return injected;
  }

  const {data, error} = await supabase
    .from('schedule')
    .select(SCHEDULE_COLUMNS)
    .order('start_time', {ascending: true});

  if (error) {
    throw new Error(`Не удалось загрузить расписание: ${error.message}`);
  }

  return groupRowsIntoWeek((data ?? []) as ScheduleRow[]);
}

/**
 * One segment as the edit page holds it, before it is validated and saved.
 *
 * Times stay strings in `HH:MM`, exactly as the table stores them, so the form
 * and the database agree without a conversion step.
 */
export type EditableEntry = {
  id: string;
  day: DayKey;
  start: string;
  end: string;
  kind: EntryKind;
  icon: string;
  title: string;
  note: string;
  tracked: boolean;
};

/**
 * Write one segment, inserting it or replacing the row with the same id.
 *
 * @param entry Segment to save.
 * @throws Error when Supabase reports a failure.
 */
export async function saveEntry(entry: EditableEntry): Promise<void> {
  const {error} = await supabase.from('schedule').upsert({
    id: entry.id,
    day: entry.day,
    start_time: entry.start,
    end_time: entry.end,
    kind: entry.kind,
    icon: entry.icon,
    title: entry.title,
    note: entry.note,
    tracked: entry.tracked,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Не удалось сохранить отрезок: ${error.message}`);
  }
}

/**
 * Delete one segment. Its done marks go with it through the foreign key.
 *
 * @param entryId Identifier of the segment.
 * @throws Error when Supabase reports a failure.
 */
export async function deleteEntry(entryId: string): Promise<void> {
  const {error} = await supabase.from('schedule').delete().eq('id', entryId);

  if (error) {
    throw new Error(`Не удалось удалить отрезок: ${error.message}`);
  }
}
