import {Badge} from '@astryxdesign/core/Badge';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {Divider} from '@astryxdesign/core/Divider';
import {Grid} from '@astryxdesign/core/Grid';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Section} from '@astryxdesign/core/Section';
import {Stack} from '@astryxdesign/core/Stack';
import {Heading, Text} from '@astryxdesign/core/Text';
import type {ReactNode} from 'react';

import {useNarrowViewport, useWeekLayout} from '../columns';
import type {MarkStore} from '../marks';
import {
  DAY_KEYS,
  addDays,
  countProgress,
  dateKey,
  formatDayTitle,
  isSameDate,
  type DayKey,
  type ScheduleDay,
} from '../schedule';
import {useRangeMarks} from '../useMarks';
import {ProgressRing} from './ProgressRing';

type WeekViewProps = {
  /** Monday of the shown week. */
  weekStart: Date;
  /** The loaded schedule, one entry per week day. */
  week: ScheduleDay[];
  today: Date;
  store: MarkStore;
  onOpenDay: (date: Date) => void;
};

/** Minimum progress maximum, so a day without checkboxes still renders a bar. */
const PROGRESS_FLOOR = 1;

/** Ring diameter on a phone, where a card is narrower. */
const NARROW_RING_SIZE = 40;

/** Ring diameter everywhere else. */
const RING_SIZE = 56;

/** Marks of a day that has none, so the progress reads zero without a lookup. */
const NO_MARKS: ReadonlySet<string> = new Set<string>();

/**
 * One week as seven cards, each with a ring of that day's progress.
 *
 * The week used to be a list of rows with a linear bar per day, which answered
 * the sum but read as a report. Seven cards read as a week at a glance: the ring
 * carries the share, the number inside carries the progress, and the day and its
 * date sit above. Opening a card switches to that day, where the marks are set.
 *
 * The cards step through three fixed shapes rather than flowing, so a row is
 * never left ragged: all seven across, then four above three, then two per row
 * with Sunday filling the last row on its own.
 *
 * The header still sums the whole week, and a divider keeps that sum apart from
 * the day cards below it.
 *
 * @param props Week to show, the clock, storage and the day opener.
 * @returns The week view.
 */
export function WeekView({weekStart, week, today, store, onOpenDay}: WeekViewProps) {
  const layout = useWeekLayout();
  const isNarrow = useNarrowViewport();
  const ringSize = isNarrow ? NARROW_RING_SIZE : RING_SIZE;

  const dayKeys = DAY_KEYS.map((_, index) => dateKey(addDays(weekStart, index)));
  const marksByDay = useRangeMarks(dayKeys, store);
  const weekEnd = addDays(weekStart, DAY_KEYS.length - 1);
  const daysByKey = new Map(week.map((day) => [day.key, day]));
  const entriesOf = (dayKey: DayKey) => daysByKey.get(dayKey)?.entries ?? [];

  // Sum the marked and countable segments across every day of the week, so the
  // header can show how much of the whole week is done beside the day rings.
  const weekProgress = DAY_KEYS.reduce(
    (totals, dayKey, index) => {
      const {done, total} = countProgress(
        entriesOf(dayKey),
        marksByDay.get(dateKey(addDays(weekStart, index))) ?? NO_MARKS,
      );
      return {done: totals.done + done, total: totals.total + total};
    },
    {done: 0, total: 0},
  );
  const isWeekFinished = weekProgress.total > 0 && weekProgress.done === weekProgress.total;

  /** Draw one day as a card that opens that day. */
  const renderDay = (dayKey: DayKey, index: number): ReactNode => {
    const date = addDays(weekStart, index);
    const day = daysByKey.get(dayKey);
    const {done, total} = countProgress(
      entriesOf(dayKey),
      marksByDay.get(dateKey(date)) ?? NO_MARKS,
    );

    return (
      <ClickableCard
        key={dayKey}
        label={`${formatDayTitle(date)}: сделано ${done} из ${total}`}
        variant={isSameDate(date, today) ? 'accent' : 'default'}
        elevation="low"
        padding={2}
        onClick={() => onOpenDay(date)}
      >
        <Stack direction="vertical" gap={2} hAlign="center" vAlign="between">
          <Stack direction="vertical" gap={1} hAlign="center">
            <Text type="label" color="secondary">
              {day?.label ?? dayKey}
            </Text>
            <Text type="supporting" color="secondary">
              {String(date.getDate())}
            </Text>
          </Stack>

          <ProgressRing
            value={done}
            max={total || PROGRESS_FLOOR}
            size={ringSize}
            text={`${done}/${total}`}
            textSize="var(--font-size-2xs)"
          />
        </Stack>
      </ClickableCard>
    );
  };

  /** Draw a run of days as one grid row of equal cards. */
  const renderRow = (count: number, offset: number) => (
    <Grid columns={count} gap={2}>
      {DAY_KEYS.slice(offset, offset + count).map((dayKey, index) =>
        renderDay(dayKey, offset + index),
      )}
    </Grid>
  );

  return (
    <>
      <Section variant="section" padding={4}>
        <Stack direction="vertical" gap={3}>
          <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
            <Heading level={2}>Неделя</Heading>
            <Badge
              label={
                isWeekFinished
                  ? 'неделя закрыта'
                  : `сделано ${weekProgress.done} из ${weekProgress.total}`
              }
              variant={isWeekFinished ? 'success' : 'neutral'}
            />
          </Stack>
          <Text type="body" color="secondary">
            {`${formatDayTitle(weekStart)} — ${formatDayTitle(weekEnd)}`}
          </Text>
          <ProgressBar
            label="Прогресс недели"
            value={weekProgress.done}
            max={weekProgress.total || PROGRESS_FLOOR}
            hasValueLabel
            formatValueLabel={(value, maximum) => `${value} из ${maximum}`}
          />
        </Stack>
      </Section>

      {/* The weekly total above and the day cards below are different readings,
          so a visible divider keeps the sum from blurring into the days. */}
      <Divider variant="strong" isFullBleed />

      <Section variant="transparent" padding={4}>
        <Stack direction="vertical" gap={2}>
          {/* Each row is its own grid, so a short last row stretches its cards
              across the full width instead of leaving a gap at the end. */}
          {layout === 'seven' ? renderRow(7, 0) : null}
          {layout === 'four-three' ? (
            <>
              {renderRow(4, 0)}
              {renderRow(3, 4)}
            </>
          ) : null}
          {layout === 'two-two-two-one' ? (
            <>
              {renderRow(2, 0)}
              {renderRow(2, 2)}
              {renderRow(2, 4)}
              {renderRow(1, 6)}
            </>
          ) : null}
        </Stack>
      </Section>
    </>
  );
}
