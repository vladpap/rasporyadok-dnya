import {Badge} from '@astryxdesign/core/Badge';
import {Grid} from '@astryxdesign/core/Grid';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Section} from '@astryxdesign/core/Section';
import {Stack} from '@astryxdesign/core/Stack';
import {Heading, Text} from '@astryxdesign/core/Text';

import {distributeIntoColumns, useColumnCount} from '../columns';
import {
  countProgress,
  dateKey,
  entryPhase,
  formatDayTitle,
  isMarkingOpen,
  isSameDate,
  minutesOfDate,
  type ScheduleDay,
  type ScheduleEntry,
} from '../schedule';
import type {MarkStore} from '../marks';
import {useDayMarks} from '../useMarks';
import {EntryCard} from './EntryCard';

type DayViewProps = {
  day: ScheduleDay;
  date: Date;
  /** The current moment. */
  now: Date;
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
 * follows the clock rather than jumping across rows. A segment can be marked
 * only while its window is open, which the card itself enforces by not being
 * clickable once that window has closed.
 *
 * @param props Day to show, the clock, and the mark storage.
 * @returns The day view.
 */
export function DayView({day, date, now, store}: DayViewProps) {
  const {doneIds, toggle} = useDayMarks(dateKey(date), store);
  const {done, total} = countProgress(day.entries, doneIds);
  const isDayFinished = total > 0 && done === total;
  const columns = distributeIntoColumns(day.entries, useColumnCount());

  // Times only mean "passed" or "running" on the day that is actually today.
  const nowMinutes = isSameDate(date, now) ? minutesOfDate(now) : null;

  const renderCard = (entry: ScheduleEntry) => {
    const phase = entryPhase(entry, nowMinutes);
    return (
      <EntryCard
        key={entry.id}
        entry={entry}
        isDone={doneIds.has(entry.id)}
        isRunningNow={phase === 'current'}
        hasPassed={phase === 'past'}
        canMark={isMarkingOpen(date, entry, now)}
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
          <Text type="supporting" color="secondary">
            Отметить можно, когда время отрезка наступило и в течение часа после его окончания — потом карточка закрывается.
          </Text>
        </Stack>
      </Section>

      <Section variant="transparent" padding={4}>
        {/* One grid row whose cells are whole columns, so every column gets the
            same width. A horizontal stack would size each column from its
            contents first, which made a column holding a long title wider than
            the rest. */}
        <Grid columns={columns.length} gap={3} align="start">
          {columns.map((columnEntries, columnIndex) => (
            <Stack key={columnIndex} direction="vertical" gap={3}>
              {columnEntries.map((entry) => renderCard(entry))}
            </Stack>
          ))}
        </Grid>
      </Section>
    </>
  );
}
