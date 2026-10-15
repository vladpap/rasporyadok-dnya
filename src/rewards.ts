/**
 * The reward rule: how many stars a finished day earns.
 *
 * A star appears when a segment is marked done and its marking window has
 * closed, so a mark that is still changeable cannot earn anything yet. The stars
 * are then counted in the order the segments closed: the first four are worth one
 * each, and the fifth, sixth and seventh carry a bonus, which is what makes a
 * finished weekday worth fifteen. A weekend day holds fewer countable segments,
 * so there the highest award is given for finishing whatever the day holds.
 */

import {isMarkingOpen, type ScheduleEntry} from './schedule';

/** What one star is worth, by the order the segment closed. */
const STAR_VALUES = [1, 1, 1, 1, 2, 3, 6] as const;

/** Stars a fully finished weekday earns: one per segment plus every bonus. */
export const MAX_STARS = 15;

/**
 * Countable segments a weekend day must finish to claim the highest award.
 *
 * A weekend day holds too few countable segments to reach the full fifteen, so
 * finishing the first one is what earns the wreath there.
 */
const WEEKEND_AWARD_THRESHOLD = 1;

/** One star as the header shows it. */
export type AwardStar = {
  /** What the star is worth, drawn inside it as a number. */
  value: number;
  /** Whether this star carries the laurel wreath of the highest award. */
  hasLaurel: boolean;
};

/** What a day has earned so far. */
export type DayAward = {
  /** Stars to draw, in the order they were earned. */
  stars: AwardStar[];
  /** Total stars the day has earned. */
  total: number;
  /** Whether the day reached its highest award. */
  hasHighest: boolean;
};

/** Days that hold fewer countable segments than a weekday. */
const WEEKEND_DAYS = new Set(['sat', 'sun']);

/**
 * Whether a segment has closed its marking window while carrying a mark.
 *
 * This is what makes a star final: while the window is open the mark can still be
 * taken back, so the segment has not earned anything yet.
 *
 * @param entry Segment of the shown day.
 * @param date The day being shown.
 * @param now The current moment.
 * @param isDone Whether the segment carries a mark.
 * @returns True when the mark is final.
 */
function hasClosed(entry: ScheduleEntry, date: Date, now: Date, isDone: boolean): boolean {
  return isDone && !isMarkingOpen(date, entry, now);
}

/**
 * Work out what a day has earned.
 *
 * @param entries Segments of the shown day, in time order.
 * @param doneIds Identifiers marked as done.
 * @param date The day being shown.
 * @param now The current moment.
 * @param dayKey Week day key, which decides whether the day is a weekend one.
 * @returns The stars earned and their total.
 */
export function countDayAward(
  entries: readonly ScheduleEntry[],
  doneIds: ReadonlySet<string>,
  date: Date,
  now: Date,
  dayKey: string,
): DayAward {
  const countable = entries.filter((entry) => entry.tracked);
  const closedCount = countable.filter((entry) =>
    hasClosed(entry, date, now, doneIds.has(entry.id)),
  ).length;

  if (closedCount === 0) {
    return {stars: [], total: 0, hasHighest: false};
  }

  // A weekend day hands over the highest award as soon as one countable segment
  // is finished, because it cannot hold enough to earn the weekday fifteen.
  if (WEEKEND_DAYS.has(dayKey) && closedCount >= WEEKEND_AWARD_THRESHOLD) {
    return {stars: [{value: MAX_STARS, hasLaurel: true}], total: MAX_STARS, hasHighest: true};
  }

  // A weekday earns a star per closed segment, and the last stars carry a bonus.
  const stars: AwardStar[] = [];
  let total = 0;

  for (let index = 0; index < closedCount; index += 1) {
    const value = STAR_VALUES[Math.min(index, STAR_VALUES.length - 1)];
    stars.push({value, hasLaurel: false});
    total += value;
  }

  // Finishing every countable segment replaces the row with one great star.
  const hasHighest = countable.length > 0 && closedCount === countable.length;
  if (hasHighest) {
    return {stars: [{value: MAX_STARS, hasLaurel: true}], total: MAX_STARS, hasHighest: true};
  }

  return {stars, total, hasHighest};
}
