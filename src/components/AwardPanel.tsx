import {Stack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
import type {ReactNode} from 'react';

import type {DayAward} from '../rewards';
import {AwardStar, type AwardKind} from './AwardStar';

type AwardPanelProps = {
  /** What the day has earned so far. */
  award: DayAward;
  /** Week day key, so the panel can name the weekend rule correctly. */
  dayKey: string;
};

/** Width of one star in the row. */
const STAR_SIZE = 30;

/** Width of the single highest award, which stands alone and larger. */
const HIGHEST_STAR_SIZE = 56;

/** Days whose highest award arrives with the first finished segment. */
const WEEKEND_DAYS = new Set(['sat', 'sun']);

/**
 * The drawing each star value uses.
 *
 * The artwork is drawn per size rather than repeated: one star for the early
 * segments, the double star for the fifth, the triple for the sixth, and the
 * numbered wreath for the whole day.
 */
const KIND_BY_VALUE: Record<number, AwardKind> = {
  1: 'one',
  2: 'two',
  3: 'three',
};

/**
 * The stars a day has earned, shown on the right of the day header.
 *
 * While the day is unfinished the stars stand in a row, each drawn at the weight
 * it was worth, so the row grows as the day is closed out. The highest award
 * replaces that row with the single wreath, because at that point the day has
 * nothing left to earn and a row of small stars would say less.
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
          <AwardStar kind="highest" size={HIGHEST_STAR_SIZE} />
          <Text type="supporting" color="secondary">
            высшая награда
          </Text>
        </Stack>
      ) : (
        <Stack direction="horizontal" gap={1} vAlign="center">
          {award.stars.map((star, index) => (
            <AwardStar key={index} kind={KIND_BY_VALUE[star.value] ?? 'one'} size={STAR_SIZE} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
