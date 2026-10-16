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
 * Days one press of an arrow moves.
 *
 * One day, because the arrows are for walking through the schedule and a jump
 * loses the sense of where in the week the reader has landed.
 */
const DAY_STEP = 1;

/**
 * How far the arrows reach from today, in days.
 *
 * Browsing further than a month either way is what the calendar is for, so the
 * arrows stop rather than walking forever and leaving the reader lost. The limit
 * is measured from today, not from the day on screen, so it does not move as the
 * reader steps.
 */
const DAY_REACH = 30;

/** Size of the heading icons, large enough to read as controls. */
const ICON_SIZE = 'sm';

/**
 * The day heading with its controls: step back, step forward, today, calendar.
 *
 * The arrows move one day at a time and stop at the edge of a month either side of
 * today, where they are shown but inactive: a control that vanishes is harder to
 * read than one that is plainly out of reach. Further dates are the calendar's
 * job, which is why it sits beside them.
 *
 * The today control appears only when the day shown is not today, so it never
 * offers to do nothing; its arrival is also what tells the reader they have moved
 * off today.
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

  // The reach is measured on calendar days, so step and limit agree about what a
  // day is even across a month boundary or a daylight saving change.
  const earliest = dateKey(addDays(now, -DAY_REACH));
  const latest = dateKey(addDays(now, DAY_REACH));
  const current = dateKey(date);
  const canStepBack = current > earliest;
  const canStepForward = current < latest;

  return (
    <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
      <IconButton
        label="Предыдущий день"
        tooltip="Предыдущий день"
        variant="ghost"
        isDisabled={!canStepBack}
        icon={<Icon icon={ChevronLeft} size={ICON_SIZE} color="accent" />}
        onClick={() => onSelectDate(addDays(date, -DAY_STEP))}
      />

      <Heading level={2}>{formatDayTitleShort(date)}</Heading>

      <IconButton
        label="Следующий день"
        tooltip="Следующий день"
        variant="ghost"
        isDisabled={!canStepForward}
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
            value={current as ISODateString}
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
