/**
 * Column layout for the day: how many columns fit the width, and how the
 * segments are spread across them.
 *
 * The cards read downwards, so a column is filled to its end before the next
 * one starts. That is what `@astryxdesign/core/Grid` cannot express, because a
 * grid fills row by row, and it is why the distribution is done here and the
 * columns are rendered as stacks.
 */

import {useMediaQuery} from '@astryxdesign/core/hooks';

/**
 * Narrowest viewport that fits two cards side by side, in pixels.
 * Two cards plus the page padding need roughly this much room to stay readable.
 */
const TWO_COLUMN_MIN_WIDTH = 900;

/** Narrowest viewport that fits three cards side by side, in pixels. */
const THREE_COLUMN_MIN_WIDTH = 1400;

/**
 * Widest viewport that still counts as narrow, in pixels.
 * A phone needs smaller progress rings in the month grid than a desktop does.
 */
const NARROW_MAX_WIDTH = 599;

const TWO_COLUMN_QUERY = `(min-width: ${TWO_COLUMN_MIN_WIDTH}px)`;
const THREE_COLUMN_QUERY = `(min-width: ${THREE_COLUMN_MIN_WIDTH}px)`;
const NARROW_QUERY = `(max-width: ${NARROW_MAX_WIDTH}px)`;

/**
 * Whether the viewport is phone sized.
 *
 * @returns True on a narrow viewport.
 */
export function useNarrowViewport(): boolean {
  return useMediaQuery(NARROW_QUERY);
}

/** How the seven days of a week are arranged at the current width. */
export type WeekLayout = 'seven' | 'four-three' | 'two-two-two-one';

/** Narrowest viewport that still fits all seven day cards in one row. */
const WEEK_SEVEN_MIN_WIDTH = 1200;

/** Narrowest viewport that still fits four day cards in a row. */
const WEEK_FOUR_MIN_WIDTH = 700;

const WEEK_SEVEN_QUERY = `(min-width: ${WEEK_SEVEN_MIN_WIDTH}px)`;
const WEEK_FOUR_QUERY = `(min-width: ${WEEK_FOUR_MIN_WIDTH}px)`;

/**
 * How the week should be arranged at the current width.
 *
 * The week steps through three fixed arrangements rather than flowing, because a
 * flowing grid leaves a ragged last row: four then three leaves a gap unless the
 * three stretch, and a phone shows two per row with the last day filling the row
 * on its own. Each step is a deliberate shape, so the week always reads as
 * whole rows.
 *
 * @returns The arrangement to draw.
 */
export function useWeekLayout(): WeekLayout {
  const fitsSeven = useMediaQuery(WEEK_SEVEN_QUERY);
  const fitsFour = useMediaQuery(WEEK_FOUR_QUERY);

  if (fitsSeven) {
    return 'seven';
  }
  return fitsFour ? 'four-three' : 'two-two-two-one';
}

/**
 * How many columns the current viewport fits.
 *
 * The hook reports the widths the layout switches at rather than a measured
 * container width, which keeps the layout free of resize observers. It returns
 * one column until the width is known, so the narrow layout is the safe default.
 *
 * @returns One, two or three columns.
 */
export function useColumnCount(): number {
  const fitsTwoColumns = useMediaQuery(TWO_COLUMN_QUERY);
  const fitsThreeColumns = useMediaQuery(THREE_COLUMN_QUERY);

  if (fitsThreeColumns) {
    return 3;
  }
  return fitsTwoColumns ? 2 : 1;
}

/**
 * Spread items across columns, filling each column to its end before starting
 * the next, so reading order runs down a column and then continues in the next.
 *
 * The width decides how many columns fit, but a column is only used when the
 * items can fill it fairly: seven segments across three columns would come out
 * as three, three and one, which leaves a column that looks broken. In that case
 * the count drops until the columns are balanced, so seven segments take two
 * columns of four and three instead.
 *
 * With fewer items than columns the later columns stay empty rather than
 * receiving a share, which keeps the reading order stable as the list grows.
 *
 * @param items Items in reading order.
 * @param columnCount Number of columns the width could fit.
 * @returns One array of items per column actually used.
 */
export function distributeIntoColumns<Item>(
  items: readonly Item[],
  columnCount: number,
): Item[][] {
  if (columnCount <= 1 || items.length === 0) {
    return [[...items]];
  }

  // A column is worth using only when it receives at least half of what the
  // fullest one gets, so a nearly empty trailing column is avoided.
  let usedColumns = Math.min(columnCount, items.length);
  while (usedColumns > 1) {
    const itemsPerColumn = Math.ceil(items.length / usedColumns);
    const lastColumnSize = items.length - itemsPerColumn * (usedColumns - 1);
    if (lastColumnSize >= itemsPerColumn / 2) {
      break;
    }
    usedColumns -= 1;
  }

  const itemsPerColumn = Math.ceil(items.length / usedColumns);
  const columns: Item[][] = [];

  for (let start = 0; start < items.length; start += itemsPerColumn) {
    columns.push(items.slice(start, start + itemsPerColumn));
  }

  return columns;
}
