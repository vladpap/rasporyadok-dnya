import {Stack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
import type {ReactNode} from 'react';

import type {DayAward} from '../rewards';
import {AwardStar} from './AwardStar';

type AwardPanelProps = {
  /** What the day has earned so far. */
  award: DayAward;
  /** Week day key, so the text can name the weekend rule correctly. */
  dayKey: string;
};

/** Star diameter in the header row. */
const STAR_SIZE = 28;

/** Star diameter for the single highest award, which stands alone and larger. */
const HIGHEST_STAR_SIZE = 44;

/** Days whose highest award arrives with the first finished segment. */
const WEEKEND_DAYS = new Set(['sat', 'sun']);

/**
 * The stars a day has earned, shown on the right of the day header.
 *
 * While the day is unfinished the stars stand in a row, each carrying what it was
 * worth, so the row grows as the day is closed out. The highest award replaces
 * that row with one larger star and its wreath, because at that point the day has
 * nothing left to earn and a row of small stars would say less.
 *
 * Room is reserved even when nothing has been earned, so the header does not jump
 * when the first star arrives.
 *
 * @param props What the day earned and which day it is.
 * @returns The award panel.
 */
export function AwardPanel({award, dayKey}: AwardPanelProps): ReactNode {
  const isWeekend = WEEKEND_DAYS.has(dayKey);

  const hint = award.hasHighest
    ? 'высшая награда'
    : isWeekend
      ? 'высшая награда — за первое выполненное задание'
      : `звёзды: ${award.total} из 15`;

  return (
    <Stack direction="horizontal" gap={3} vAlign="center" aria-label={`Награда: ${hint}`}>
      {award.hasHighest ? (
        <Stack direction="horizontal" gap={2} vAlign="center">
          <AwardStar size={HIGHEST_STAR_SIZE} hasLaurel label="15" />
          <Text type="supporting" color="secondary">
            высшая награда
          </Text>
        </Stack>
      ) : (
        <Stack direction="horizontal" gap={1} vAlign="center">
          {award.stars.map((star, index) => (
            <AwardStar key={index} size={STAR_SIZE} label={String(star.value)} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
