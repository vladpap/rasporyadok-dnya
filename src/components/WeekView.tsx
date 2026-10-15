import {Badge} from '@astryxdesign/core/Badge';
import {Divider} from '@astryxdesign/core/Divider';
import {Stack} from '@astryxdesign/core/Layout';
import {List, ListItem} from '@astryxdesign/core/List';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Section} from '@astryxdesign/core/Section';
import {Heading, Text} from '@astryxdesign/core/Text';

import type {MarkStore} from '../marks';
import {
  DAY_KEYS,
  addDays,
  countProgress,
  dateKey,
  formatDayTitle,
  getScheduleDay,
  isSameDate,
} from '../schedule';
import {useRangeMarks} from '../useMarks';

type WeekViewProps = {
  /** Monday of the shown week. */
  weekStart: Date;
  today: Date;
  store: MarkStore;
  onOpenDay: (date: Date) => void;
};

/** Minimum progress maximum, so a day without checkboxes still renders a bar. */
const PROGRESS_FLOOR = 1;

/**
 * The whole week as a list of days.
 *
 * The header sums the week: a badge with how much is done and a progress bar
 * over every countable segment of the week. Below it every day row shows its
 * date, its own progress bar and a marker for today. Opening a row switches to
 * the day view for that date, where the marks themselves are set.
 *
 * @param props Week to show, the clock, storage and the day opener.
 * @returns The week view.
 */
export function WeekView({weekStart, today, store, onOpenDay}: WeekViewProps) {
  const dayKeys = DAY_KEYS.map((_, index) => dateKey(addDays(weekStart, index)));
  const marksByDay = useRangeMarks(dayKeys, store);
  const weekEnd = addDays(weekStart, DAY_KEYS.length - 1);

  // Sum the marked and countable segments across every day of the week, so the
  // header can show how much of the whole week is done beside the per-day bars.
  const weekProgress = DAY_KEYS.reduce(
    (totals, dayKey, index) => {
      const {done, total} = countProgress(
        getScheduleDay(dayKey).entries,
        marksByDay.get(dateKey(addDays(weekStart, index))) ?? new Set<string>(),
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

      {/* The weekly total above and the per-day rows below are different
          readings, so a visible divider keeps the sum from blurring into the
          list of days. */}
      <Divider variant="strong" isFullBleed />

      <Section variant="transparent" padding={0}>
        <List density="balanced" hasDividers>
          {DAY_KEYS.map((dayKey, index) => {
            const date = addDays(weekStart, index);
            const day = getScheduleDay(dayKey);
            const doneIds = marksByDay.get(dateKey(date)) ?? new Set<string>();
            const {done, total} = countProgress(day.entries, doneIds);

            return (
              <ListItem
                key={dayKey}
                label={`${day.label} · ${formatDayTitle(date)}`}
                description={
                  <Stack direction="vertical" gap={1}>
                    <ProgressBar
                      label={`Прогресс: ${day.fullLabel}`}
                      value={done}
                      max={total || PROGRESS_FLOOR}
                      hasValueLabel
                      formatValueLabel={(value, maximum) => `${value} из ${maximum}`}
                    />
                  </Stack>
                }
                endContent={isSameDate(date, today) ? <Badge label="сегодня" variant="purple" /> : null}
                onClick={() => onOpenDay(date)}
              />
            );
          })}
        </List>
      </Section>
    </>
  );
}
