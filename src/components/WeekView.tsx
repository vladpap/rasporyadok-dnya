import {Badge} from '@astryxdesign/core/Badge';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {Divider} from '@astryxdesign/core/Divider';
import {Grid} from '@astryxdesign/core/Grid';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Section} from '@astryxdesign/core/Section';
import {Stack} from '@astryxdesign/core/Stack';
import {Heading, Text} from '@astryxdesign/core/Text';

import {useNarrowViewport} from '../columns';
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

/** Ring diameter on a phone, where seven columns have little room. */
const NARROW_RING_SIZE = 34;

/** Ring diameter everywhere else. */
const RING_SIZE = 56;

/** Height of one day card on a phone, where the ring is smaller. */
const NARROW_CARD_HEIGHT = 104;

/** Height of one day card everywhere else, sized so the card reads as a square. */
const CARD_HEIGHT = 132;

/** Marks of a day that has none, so the progress reads zero without a lookup. */
const NO_MARKS: ReadonlySet<string> = new Set<string>();

/**
 * One week as seven square cards, each with a ring of that day's progress.
 *
 * The week used to be a list of rows with a linear bar each, which answered the
 * sum but read as a report. Seven cards in a row read as a week at a glance: the
 * ring carries the share, the number in the middle carries the progress, and the
 * day and its date sit above. Opening a card switches to that day, where the
 * marks themselves are set.
 *
 * The header still sums the whole week, and a divider keeps that sum apart from
 * the days below it.
 *
 * @param props Week to show, the clock, storage and the day opener.
 * @returns The week view.
 */
export function WeekView({weekStart, week, today, store, onOpenDay}: WeekViewProps) {
  const isNarrow = useNarrowViewport();
  const ringSize = isNarrow ? NARROW_RING_SIZE : RING_SIZE;
  const cardHeight = isNarrow ? NARROW_CARD_HEIGHT : CARD_HEIGHT;

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
        <Grid columns={DAY_KEYS.length} gap={2}>
          {DAY_KEYS.map((dayKey, index) => {
            const date = addDays(weekStart, index);
            const day = daysByKey.get(dayKey);
            const {done, total} = countProgress(
              entriesOf(dayKey),
              marksByDay.get(dateKey(date)) ?? NO_MARKS,
            );
            const isToday = isSameDate(date, today);

            return (
              <ClickableCard
                key={dayKey}
                label={`${formatDayTitle(date)}: сделано ${done} из ${total}`}
                variant={isToday ? 'purple' : 'default'}
                elevation="low"
                padding={2}
                height={cardHeight}
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
          })}
        </Grid>
      </Section>
    </>
  );
}
