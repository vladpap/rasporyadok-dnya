import {Badge} from '@astryxdesign/core/Badge';
import {Card} from '@astryxdesign/core/Card';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {Icon} from '@astryxdesign/core/Icon';
import {Stack} from '@astryxdesign/core/Layout';
import {Heading, Text} from '@astryxdesign/core/Text';

import {resolveIcon} from '../icons';
import {formatTimeRange, type ScheduleEntry} from '../schedule';

type EntryCardProps = {
  entry: ScheduleEntry;
  isDone: boolean;
  /** Whether the segment is the one running now. */
  isRunningNow: boolean;
  /** Whether the segment already finished. */
  hasPassed: boolean;
  onToggle: (entryId: string) => void;
};

/**
 * One segment of the day as a card.
 *
 * Segments that carry a mark are clickable: the whole card toggles the mark, so
 * the card is the single control and there is no second checkbox to tab to.
 * Segments without a mark (breaks, meals, sleep) are plain cards.
 *
 * The card look carries the state: a marked segment is accent coloured with a
 * check, a finished or service segment is muted, and everything still ahead
 * uses the standard card surface. The running segment also carries a badge, so
 * the state never rests on colour alone.
 *
 * @param props Segment with its state and the toggle handler.
 * @returns A schedule card.
 */
export function EntryCard({entry, isDone, isRunningNow, hasPassed, onToggle}: EntryCardProps) {
  const SegmentIcon = resolveIcon(entry.icon);

  const variant = isDone ? 'purple' : hasPassed || !entry.tracked ? 'muted' : 'default';

  const content = (
    <Stack direction="horizontal" gap={3} vAlign="start">
      <Icon icon={SegmentIcon} size="lg" />
      <Stack direction="vertical" gap={1}>
        <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
          <Text type="label" color="secondary">
            {formatTimeRange(entry)}
          </Text>
          {isDone && <Icon icon="check" size="sm" label="отмечено" />}
          {isRunningNow && <Badge label="сейчас" variant="purple" />}
        </Stack>
        <Heading level={4}>{entry.title}</Heading>
        {entry.note ? (
          <Text type="supporting" color="secondary">
            {entry.note}
          </Text>
        ) : null}
      </Stack>
    </Stack>
  );

  if (!entry.tracked) {
    return (
      <Card variant={variant} elevation="low" padding={5}>
        {content}
      </Card>
    );
  }

  const stateText = isDone ? 'отмечено' : 'не отмечено';

  return (
    <ClickableCard
      label={`${entry.title}, ${formatTimeRange(entry)}, ${stateText}`}
      variant={variant}
      elevation="low"
      padding={5}
      onClick={() => onToggle(entry.id)}
    >
      {content}
    </ClickableCard>
  );
}
