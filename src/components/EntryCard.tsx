import {Badge} from '@astryxdesign/core/Badge';
import {Card} from '@astryxdesign/core/Card';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {Icon} from '@astryxdesign/core/Icon';
import {Stack, StackItem} from '@astryxdesign/core/Layout';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Circle, CircleCheck} from 'lucide-react';

import {resolveIcon} from '../icons';
import {formatTimeRange, type ScheduleEntry} from '../schedule';

type EntryCardProps = {
  entry: ScheduleEntry;
  isDone: boolean;
  /** Whether the segment is the one running now. */
  isRunningNow: boolean;
  /** Whether the segment already finished. */
  hasPassed: boolean;
  /** Whether the segment may still be marked, or unmarked. */
  canMark: boolean;
  onToggle: (entryId: string) => void;
};

/**
 * Height of every segment card, in pixels.
 *
 * Fixed so the cards line up in their columns: the note is optional, and letting
 * the content decide the height made a card with a note taller than one without,
 * which left the columns ragged. The value fits the tallest real case, a card
 * whose title wraps onto a second line and that also carries a note, so nothing
 * is cut off. Both card kinds take it, since the clickable one has no minimum
 * height of its own.
 */
const CARD_HEIGHT = 148;

/**
 * One segment of the day as a card.
 *
 * Segments that carry a mark are clickable while their marking window is open:
 * the whole card toggles the mark, so the card is the single control and there
 * is no second checkbox to tab to. Once the window closed, the card turns into a
 * plain card that still shows the mark it earned, and simply cannot be changed.
 *
 * The card look carries the state: a marked segment is accent coloured, a
 * finished, closed or service segment is muted, and everything still ahead uses
 * the standard card surface. A segment that counts toward the progress also
 * carries a mark on its right edge, an empty circle that becomes a filled check,
 * so what is expected and what is done is readable at a glance. The running
 * segment carries a badge as well, so no state rests on colour alone.
 *
 * @param props Segment with its state and the toggle handler.
 * @returns A schedule card.
 */
export function EntryCard({
  entry,
  isDone,
  isRunningNow,
  hasPassed,
  canMark,
  onToggle,
}: EntryCardProps) {
  const SegmentIcon = resolveIcon(entry.icon);

  const isInteractive = entry.tracked && canMark;
  const isMuted = hasPassed || !entry.tracked || !canMark;
  const variant = isDone ? 'purple' : isMuted ? 'muted' : 'default';

  const content = (
    <Stack direction="horizontal" gap={3} vAlign="center">
      <Icon icon={SegmentIcon} size="lg" />
      <StackItem size="fill">
        <Stack direction="vertical" gap={1}>
          <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
            <Text type="label" color="secondary">
              {formatTimeRange(entry)}
            </Text>
            {isRunningNow && <Badge label="сейчас" variant="purple" />}
          </Stack>
          <Heading level={4}>{entry.title}</Heading>
          {entry.note ? (
            <Text type="supporting" color="secondary">
              {entry.note}
            </Text>
          ) : null}
        </Stack>
      </StackItem>

      {/* A segment that counts toward the progress says so on its right edge:
          an empty circle while it still waits, a filled check once it is done.
          The state is then readable without opening the card, and it reads the
          same whether or not the card is still clickable. */}
      {entry.tracked ? (
        <Icon
          icon={isDone ? CircleCheck : Circle}
          size="lg"
          label={isDone ? 'отмечено' : 'нужно отметить'}
        />
      ) : null}
    </Stack>
  );

  if (!isInteractive) {
    return (
      <Card variant={variant} elevation="low" padding={5} height={CARD_HEIGHT}>
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
      height={CARD_HEIGHT}
      onClick={() => onToggle(entry.id)}
    >
      {content}
    </ClickableCard>
  );
}
