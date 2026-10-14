import {Badge} from '@astryxdesign/core/Badge';
import {CheckboxListItem} from '@astryxdesign/core/CheckboxList';
import {ListItem} from '@astryxdesign/core/List';

import {formatTimeRange, type ScheduleEntry} from '../schedule';

type EntryRowProps = {
  entry: ScheduleEntry;
  isDone: boolean;
  isRunningNow: boolean;
  onToggle: (entryId: string) => void;
};

/**
 * One segment of the day as a row.
 *
 * Segments that carry a checkbox are rendered with one, so a mark can be set;
 * breaks, meals and sleep have no checkbox and stay informational. The running
 * segment is marked with a badge, which keeps the state readable without
 * relying on colour alone.
 *
 * @param props Segment, its mark and the toggle handler.
 * @returns A list row.
 */
export function EntryRow({entry, isDone, isRunningNow, onToggle}: EntryRowProps) {
  const timeRange = formatTimeRange(entry);
  const description = entry.note ? `${timeRange} · ${entry.note}` : timeRange;
  const runningBadge = isRunningNow ? <Badge label="сейчас" variant="purple" /> : null;

  if (!entry.tracked) {
    return <ListItem label={entry.title} description={description} endContent={runningBadge} />;
  }

  return (
    <CheckboxListItem
      label={entry.title}
      description={description}
      endContent={runningBadge}
      isChecked={isDone}
      onCheck={() => onToggle(entry.id)}
    />
  );
}
