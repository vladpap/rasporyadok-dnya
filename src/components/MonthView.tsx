import {Badge} from '@astryxdesign/core/Badge';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {Grid} from '@astryxdesign/core/Grid';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Section} from '@astryxdesign/core/Section';
import {Stack} from '@astryxdesign/core/Stack';
import {Heading, Text} from '@astryxdesign/core/Text';

import {useNarrowViewport} from '../columns';
import {addMonths, buildMonthGrid, formatMonthTitle, isSameMonth, monthGridKeys} from '../month';
import type {MarkStore} from '../marks';
import {
  DAY_KEYS,
  countProgress,
  dateKey,
  dayKeyForDate,
  formatDayTitle,
  isSameDate,
  type ScheduleDay,
} from '../schedule';
import {useRangeMarks} from '../useMarks';
import {ProgressRing} from './ProgressRing';

type MonthViewProps = {
  /** Any date inside the month to show. */
  monthAnchor: Date;
  /** The loaded schedule, one entry per week day. */
  week: ScheduleDay[];
  today: Date;
  store: MarkStore;
  /** Move the shown month, without leaving the month view. */
  onNavigateMonth: (date: Date) => void;
  /** Open one day in the day view. */
  onOpenDay: (date: Date) => void;
};

/** Ring diameter on a phone, where seven columns have little room. */
const NARROW_RING_SIZE = 30;

/** Ring diameter everywhere else. */
const RING_SIZE = 44;

/** Marks of a day that has none, so the progress reads zero without a lookup. */
const NO_MARKS: ReadonlySet<string> = new Set<string>();

/** Minimum ring maximum, so a day without checkboxes still draws a track. */
const RING_FLOOR = 1;

/** Minimum progress maximum, so an empty month still renders a valid bar. */
const PROGRESS_FLOOR = 1;

/**
 * One month as a calendar grid, where every day is a ring of its own progress.
 *
 * The header sums the month: a badge and a progress bar over every countable
 * segment of the month, alongside the month title and its previous/next
 * buttons. A ring answers "how much of that day is done" without opening the
 * day, which a month of numbers cannot, and the number stays in the middle so
 * the date is still the first thing read. Days outside the month are shown
 * faded to keep the weeks whole; today is accent coloured.
 *
 * @param props Month to show, the clock, storage and the navigation handlers.
 * @returns The month view.
 */
export function MonthView({
  monthAnchor,
  week,
  today,
  store,
  onNavigateMonth,
  onOpenDay,
}: MonthViewProps) {
  const ringSize = useNarrowViewport() ? NARROW_RING_SIZE : RING_SIZE;
  const weeks = buildMonthGrid(monthAnchor);
  const marksByDay = useRangeMarks(monthGridKeys(weeks), store);
  const daysInMonth = weeks.flat().filter((date) => isSameMonth(date, monthAnchor));
  const daysByKey = new Map(week.map((day) => [day.key, day]));
  const entriesOf = (date: Date) => daysByKey.get(dayKeyForDate(date))?.entries ?? [];

  const monthProgress = daysInMonth.reduce(
    (totals, date) => {
      const {done, total} = countProgress(entriesOf(date), marksByDay.get(dateKey(date)) ?? NO_MARKS);
      return {done: totals.done + done, total: totals.total + total};
    },
    {done: 0, total: 0},
  );
  const isMonthFinished =
    monthProgress.total > 0 && monthProgress.done === monthProgress.total;

  return (
    <>
      <Section variant="section" padding={4}>
        <Stack direction="horizontal" gap={3} vAlign="center" justify="between" wrap="wrap">
          <Stack direction="vertical" gap={3}>
            <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
              <Heading level={2}>{formatMonthTitle(monthAnchor)}</Heading>
              <Badge
                label={
                  isMonthFinished
                    ? 'месяц закрыт'
                    : `сделано ${monthProgress.done} из ${monthProgress.total}`
                }
                variant={isMonthFinished ? 'success' : 'neutral'}
              />
            </Stack>
            <Text type="supporting" color="secondary">
              {`За месяц сделано ${monthProgress.done} из ${monthProgress.total}`}
            </Text>
            <ProgressBar
              label="Прогресс месяца"
              value={monthProgress.done}
              max={monthProgress.total || PROGRESS_FLOOR}
              hasValueLabel
              formatValueLabel={(value, maximum) => `${value} из ${maximum}`}
            />
          </Stack>

          <Stack direction="horizontal" gap={2} vAlign="center">
            <IconButton
              label="Предыдущий месяц"
              tooltip="Предыдущий месяц"
              icon={<Icon icon="chevronLeft" />}
              onClick={() => onNavigateMonth(addMonths(monthAnchor, -1))}
            />
            <IconButton
              label="Следующий месяц"
              tooltip="Следующий месяц"
              icon={<Icon icon="chevronRight" />}
              onClick={() => onNavigateMonth(addMonths(monthAnchor, 1))}
            />
          </Stack>
        </Stack>
      </Section>

      <Section variant="transparent" padding={4}>
        <Grid columns={DAY_KEYS.length} gap={1}>
          {DAY_KEYS.map((dayKey) => (
            <Stack key={dayKey} direction="vertical" hAlign="center">
              <Text type="label" color="secondary">
                {daysByKey.get(dayKey)?.label ?? dayKey}
              </Text>
            </Stack>
          ))}

          {weeks.flat().map((date) => {
            const doneIds = marksByDay.get(dateKey(date)) ?? NO_MARKS;
            const {done, total} = countProgress(entriesOf(date), doneIds);
            const isToday = isSameDate(date, today);
            const belongsToMonth = isSameMonth(date, monthAnchor);

            return (
              <ClickableCard
                key={dateKey(date)}
                label={`${formatDayTitle(date)}: сделано ${done} из ${total}`}
                variant={isToday ? 'accent' : belongsToMonth ? 'default' : 'transparent'}
                elevation="low"
                padding={1}
                onClick={() => onOpenDay(date)}
              >
                <Stack direction="vertical" hAlign="center">
                  <ProgressRing
                    value={done}
                    max={total || RING_FLOOR}
                    size={ringSize}
                    text={String(date.getDate())}
                  />
                </Stack>
              </ClickableCard>
            );
          })}
        </Grid>
      </Section>
    </>
  );
}
