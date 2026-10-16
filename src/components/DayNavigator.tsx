import {Calendar, type ISODateString} from '@astryxdesign/core/Calendar';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Popover} from '@astryxdesign/core/Popover';
import {Stack} from '@astryxdesign/core/Stack';
import {Heading} from '@astryxdesign/core/Text';
import {CalendarCheck, CalendarDays, ChevronLeft, ChevronRight} from 'lucide-react';
import {useState} from 'react';

import {addDays, dateKey, formatDayTitleShort, isSameDate} from '../schedule';

type DayNavigatorProps = {
  /** The day being shown. */
  date: Date;
  /** Show another day. */
  onSelectDate: (date: Date) => void;
  /** The current moment, so the heading knows whether it is showing today. */
  now: Date;
};

/**
 * How many days one press of an arrow moves.
 *
 * A week would be the other obvious step, but ten days keeps a whole week plus
 * its neighbours inside one press, which is what looking back over a fortnight
 * actually needs. The calendar is there for anything further.
 */
const DAY_STEP = 10;

/** Size of the heading icons, large enough to read as controls. */
const ICON_SIZE = 'sm';

/**
 * The day heading with its controls: step back, step forward, today, calendar.
 *
 * The arrows move by a fixed number of days rather than always by one, because
 * the calendar covers exact dates and the arrows are for browsing. The today
 * control appears only when the day shown is not today, since on today it would
 * do nothing; that is also what tells the reader they have moved away from it.
 *
 * Every icon is drawn in the theme accent, so the controls read as one set and
 * follow the chosen colour theme like the rest of the page.
 *
 * @param props The day being shown, the way to change it and the current moment.
 * @returns The day navigator.
 */
export function DayNavigator({date, onSelectDate, now}: DayNavigatorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const isShowingToday = isSameDate(date, now);

  return (
    <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
      <IconButton
        label={`Назад на ${DAY_STEP} дней`}
        tooltip={`Назад на ${DAY_STEP} дней`}
        variant="ghost"
        icon={<Icon icon={ChevronLeft} size={ICON_SIZE} color="accent" />}
        onClick={() => onSelectDate(addDays(date, -DAY_STEP))}
      />

      <Heading level={2}>{formatDayTitleShort(date)}</Heading>

      <IconButton
        label={`Вперёд на ${DAY_STEP} дней`}
        tooltip={`Вперёд на ${DAY_STEP} дней`}
        variant="ghost"
        icon={<Icon icon={ChevronRight} size={ICON_SIZE} color="accent" />}
        onClick={() => onSelectDate(addDays(date, DAY_STEP))}
      />

      {isShowingToday ? null : (
        <IconButton
          label="К сегодняшнему дню"
          tooltip="К сегодняшнему дню"
          variant="ghost"
          icon={<Icon icon={CalendarCheck} size={ICON_SIZE} color="accent" />}
          onClick={() => onSelectDate(new Date())}
        />
      )}

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
          icon={<Icon icon={CalendarDays} size={ICON_SIZE} color="accent" />}
        />
      </Popover>
    </Stack>
  );
}
