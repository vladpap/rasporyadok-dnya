import {Badge} from '@astryxdesign/core/Badge';
import {Stack, StackItem} from '@astryxdesign/core/Stack';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Section} from '@astryxdesign/core/Section';
import {Heading} from '@astryxdesign/core/Text';

import {distributeIntoColumns, useColumnCount} from '../columns';
import {countProgress, dateKey, entryPhase, formatDayTitle, type ScheduleDay} from '../schedule';
import type {MarkStore} from '../marks';
import {useDayMarks} from '../useMarks';
import {EntryCard} from './EntryCard';

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
 * the segments as tall cards in as many columns as the width allows, in time
 * order.
 *
 * The cards read down a column and continue in the next one, so the sequence
 * follows the clock rather than jumping across rows.
 *
 * @param props Day to show, the clock, and the mark storage.
 * @returns The day view.
 */
export function DayView({day, date, nowMinutes, store}: DayViewProps) {
  const {doneIds, toggle} = useDayMarks(dateKey(date), store);
  const {done, total} = countProgress(day.entries, doneIds);
  const isDayFinished = total > 0 && done === total;
  const columns = distributeIntoColumns(day.entries, useColumnCount());

  const renderCard = (entry: ScheduleDay['entries'][number]) => {
    const phase = entryPhase(entry, nowMinutes);
    return (
      <EntryCard
        key={entry.id}
        entry={entry}
        isDone={doneIds.has(entry.id)}
        isRunningNow={phase === 'current'}
        hasPassed={phase === 'past'}
        onToggle={toggle}
      />
    );
  };

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

      <Section variant="transparent" padding={4}>
        <Stack direction="horizontal" gap={3} vAlign="start">
          {columns.map((columnEntries, columnIndex) => (
            <StackItem key={columnIndex} size="fill">
              <Stack direction="vertical" gap={3}>
                {columnEntries.map((entry) => renderCard(entry))}
              </Stack>
            </StackItem>
          ))}
        </Stack>
      </Section>
    </>
  );
}
