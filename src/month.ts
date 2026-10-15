/**
 * Month helpers for the month view: the title, the week grid and which dates
 * belong to the shown month.
 *
 * A calendar month needs whole weeks, so the grid starts on the Monday of the
 * week that holds the first day and ends on the Sunday of the week that holds
 * the last one. That is why the grid can include a few days of the neighbouring
 * months, which the view shows faded.
 */

import {DAY_KEYS, addDays, dateKey, startOfWeek} from './schedule';

/** Days in one week, which is also the column count of a month grid. */
const DAYS_PER_WEEK = DAY_KEYS.length;

/** Month names in the nominative case, for a title such as `октябрь 2026`. */
const MONTH_TITLES = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];

/**
 * First day of the month that holds a date.
 *
 * @param date Any date.
 * @returns A new date at local midnight of the first day of that month.
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Whether two dates fall in the same month of the same year.
 *
 * @param left First date.
 * @param right Second date.
 * @returns True when both belong to one month.
 */
export function isSameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

/**
 * Move to another month, landing on its first day.
 *
 * @param date Any date.
 * @param months Months to move, negative to go back.
 * @returns A new date at local midnight of the first day of the target month.
 */
export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/**
 * Title of the month a date belongs to.
 *
 * @param date Any date.
 * @returns Text such as `октябрь 2026`.
 */
export function formatMonthTitle(date: Date): string {
  return `${MONTH_TITLES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Build the calendar grid of a month, as whole weeks of seven days.
 *
 * @param anchor Any date inside the month to show.
 * @returns Weeks of dates, Monday first; the first and last week may reach into
 *   the neighbouring months.
 */
export function buildMonthGrid(anchor: Date): Date[][] {
  const firstDay = startOfMonth(anchor);
  const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const gridStart = startOfWeek(firstDay);
  const gridEnd = addDays(startOfWeek(lastDay), DAYS_PER_WEEK - 1);

  const days: Date[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    days.push(cursor);
  }

  const weeks: Date[][] = [];
  for (let start = 0; start < days.length; start += DAYS_PER_WEEK) {
    weeks.push(days.slice(start, start + DAYS_PER_WEEK));
  }

  return weeks;
}

/**
 * Every date of the grid as a stable calendar key, for reading the marks of the
 * whole month in one go.
 *
 * @param weeks Weeks of a month grid.
 * @returns One key per day, in grid order.
 */
export function monthGridKeys(weeks: readonly Date[][]): string[] {
  return weeks.flat().map((date) => dateKey(date));
}
