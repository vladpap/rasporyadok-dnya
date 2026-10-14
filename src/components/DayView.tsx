import {Badge} from '@astryxdesign/core/Badge';
import {Stack} from '@astryxdesign/core/Layout';
import {List} from '@astryxdesign/core/List';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Section} from '@astryxdesign/core/Section';
import {Heading} from '@astryxdesign/core/Text';

import {
  countProgress,
  dateKey,
  formatDayTitle,
  splitDayPhases,
  type ScheduleDay,
  type ScheduleEntry,
} from '../schedule';
import type {MarkStore} from '../marks';
import {useDayMarks} from '../useMarks';
import {EntryRow} from './EntryRow';

type DayViewProps = {
  day: ScheduleDay;
  date: Date;
  /** Minutes from midnight, or null when the shown day is not today. */
  nowMinutes: number | null;
  store: MarkStore;
};

/** Minimum progress maximum, so an empty day still renders a valid bar. */
const PROGRESS_FLOOR = 1;

/**
 * One day of the schedule: a header with the date and the day progress, then
 * the segments in time order.
 *
 * The part of the day that already passed sits on a muted section, which is how
 * passed time is shown without a per-row colour override. The running segment
 * and everything after it stay on the plain surface.
 *
 * @param props Day to show, the clock, and the mark storage.
 * @returns The day view.
 */
export function DayView({day, date, nowMinutes, store}: DayViewProps) {
  const {doneIds, toggle} = useDayMarks(dateKey(date), store);
  const {done, total} = countProgress(day.entries, doneIds);
  const phases = splitDayPhases(day.entries, nowMinutes);
  const isDayFinished = total > 0 && done === total;

  const renderRow = (entry: ScheduleEntry) => (
    <EntryRow
      key={entry.id}
      entry={entry}
      isDone={doneIds.has(entry.id)}
      isRunningNow={phases.current.includes(entry)}
      onToggle={toggle}
    />
  );

  const upcoming = [...phases.current, ...phases.future];

  return (
    <>
      <Section variant="section" padding={4}>
        <Stack direction="vertical" gap={3}>
          <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
            <Heading level={2}>{formatDayTitle(date)}</Heading>
            <Badge
              label={isDayFinished ? 'день закрыт' : `сделано ${done} из ${total}`}
              variant={isDayFinished ? 'success' : 'neutral'}
            />
          </Stack>
          <ProgressBar
            label="Прогресс дня"
            value={done}
            max={total || PROGRESS_FLOOR}
            hasValueLabel
            formatValueLabel={(value, maximum) => `${value} из ${maximum}`}
          />
        </Stack>
      </Section>

      {phases.past.length > 0 && (
        <Section variant="muted" padding={0}>
          <List density="balanced" hasDividers>
            {phases.past.map((entry) => renderRow(entry))}
          </List>
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section variant="transparent" padding={0}>
          <List density="balanced" hasDividers>
            {upcoming.map((entry) => renderRow(entry))}
          </List>
        </Section>
      )}
    </>
  );
}
