import {Badge} from '@astryxdesign/core/Badge';
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
import {useWeekMarks} from '../useMarks';

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
 * Every day row shows its date, a progress bar over the segments that carry a
 * checkbox and a marker for today. Opening a row switches to the day view for
 * that date, where the marks themselves are set.
 *
 * @param props Week to show, the clock, storage and the day opener.
 * @returns The week view.
 */
export function WeekView({weekStart, today, store, onOpenDay}: WeekViewProps) {
  const marksByDay = useWeekMarks(weekStart, store);
  const weekEnd = addDays(weekStart, DAY_KEYS.length - 1);

  return (
    <>
      <Section variant="section" padding={4}>
        <Stack direction="vertical" gap={2}>
          <Heading level={2}>Неделя</Heading>
          <Text type="body" color="secondary">
            {`${formatDayTitle(weekStart)} — ${formatDayTitle(weekEnd)}`}
          </Text>
        </Stack>
      </Section>

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
