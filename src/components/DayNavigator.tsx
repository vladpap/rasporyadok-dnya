import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Stack} from '@astryxdesign/core/Stack';
import {Calendar, type ISODateString} from '@astryxdesign/core/Calendar';
import {Popover} from '@astryxdesign/core/Popover';
import {Heading} from '@astryxdesign/core/Text';
import {CalendarDays, ChevronLeft, ChevronRight} from 'lucide-react';
import {useState} from 'react';

import {addDays, dateKey, formatDayTitle} from '../schedule';

type DayNavigatorProps = {
  /** The day being shown. */
  date: Date;
  /** Show another day. */
  onSelectDate: (date: Date) => void;
};

/**
 * How many days one press of an arrow moves.
 *
 * A week would be the other obvious step, but ten days keeps a whole week plus
 * its neighbours inside one press, which is what looking back over a fortnight
 * actually needs. The calendar is there for anything further.
 */
const DAY_STEP = 10;

/**
 * The day heading with its controls: step back, step forward, pick a date.
 *
 * The arrows move by a fixed number of days rather than always by one, because
 * the calendar covers exact dates and the arrows are for browsing. The heading is
 * the control's label, so the day being shown is read in the same place it is
 * changed.
 *
 * @param props The day being shown and the way to change it.
 * @returns The day navigator.
 */
export function DayNavigator({date, onSelectDate}: DayNavigatorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
      <IconButton
        label={`Назад на ${DAY_STEP} дней`}
        tooltip={`Назад на ${DAY_STEP} дней`}
        variant="ghost"
        icon={<Icon icon={ChevronLeft} size="sm" />}
        onClick={() => onSelectDate(addDays(date, -DAY_STEP))}
      />

      <Heading level={2}>{formatDayTitle(date)}</Heading>

      <IconButton
        label={`Вперёд на ${DAY_STEP} дней`}
        tooltip={`Вперёд на ${DAY_STEP} дней`}
        variant="ghost"
        icon={<Icon icon={ChevronRight} size="sm" />}
        onClick={() => onSelectDate(addDays(date, DAY_STEP))}
      />

      <Popover
        isOpen={isCalendarOpen}
        onOpenChange={setIsCalendarOpen}
        placement="below"
        alignment="start"
        label="Выбор даты"
        hasAutoFocus={false}
        content={
          <Calendar
            mode="single"
            value={dateKey(date) as ISODateString}
            onChange={(nextDate) => {
              if (nextDate) {
                onSelectDate(new Date(`${nextDate}T00:00:00`));
                setIsCalendarOpen(false);
              }
            }}
            weekStartsOn="mon"
          />
        }
      >
        <IconButton
          label="Выбрать дату"
          tooltip="Выбрать дату"
          variant="ghost"
          icon={<Icon icon={CalendarDays} size="sm" />}
        />
      </Popover>
    </Stack>
  );
}
