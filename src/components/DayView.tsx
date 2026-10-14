import {Badge} from '@astryxdesign/core/Badge';
import {Grid} from '@astryxdesign/core/Grid';
import {Stack} from '@astryxdesign/core/Layout';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Section} from '@astryxdesign/core/Section';
import {Heading} from '@astryxdesign/core/Text';

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
 * Narrowest width a card may take before the grid drops a column.
 * With a maximum of three columns this yields one column on a phone, two on a
 * tablet and three on a desktop, without a width query of our own.
 */
const CARD_MIN_WIDTH = 260;

/** Most columns the grid may use on a wide screen. */
const CARD_MAX_COLUMNS = 3;

/**
 * One day of the schedule: a header with the date and the day progress, then
 * the segments as a card grid, in time order.
 *
 * The grid decides the column count from the available width, so the same page
 * works on a phone, a tablet and a desktop. Each card carries its own state:
 * accent and a check when marked, muted when the time already passed or the
 * segment is a break, meal or sleep.
 *
 * @param props Day to show, the clock, and the mark storage.
 * @returns The day view.
 */
export function DayView({day, date, nowMinutes, store}: DayViewProps) {
  const {doneIds, toggle} = useDayMarks(dateKey(date), store);
  const {done, total} = countProgress(day.entries, doneIds);
  const isDayFinished = total > 0 && done === total;

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
        <Grid columns={{minWidth: CARD_MIN_WIDTH, max: CARD_MAX_COLUMNS, repeat: 'fit'}} gap={3}>
          {day.entries.map((entry) => {
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
          })}
        </Grid>
      </Section>
    </>
  );
}
