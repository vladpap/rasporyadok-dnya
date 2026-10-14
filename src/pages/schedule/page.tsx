import {useMemo, useState} from 'react';

import {Button} from '@astryxdesign/core/Button';
import {Layout, LayoutContent, LayoutHeader, Stack} from '@astryxdesign/core/Layout';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Heading} from '@astryxdesign/core/Text';

import {DayView} from '../../components/DayView';
import {WeekView} from '../../components/WeekView';
import {createMarkStore} from '../../marks';
import {dayKeyForDate, getScheduleDay, isSameDate, minutesOfDate, startOfWeek} from '../../schedule';
import {useCurrentTime} from '../../useCurrentTime';

/** The two views the page switches between. */
type View = 'day' | 'week';

/**
 * Schedule page: the current day on top, the week behind a switch.
 *
 * The page owns the selected date and the running clock, so both views read the
 * same moment: the day view greys out what already passed and the week view
 * marks today. Opening a day from the week switches back to the day view.
 *
 * @returns The page.
 */
export default function SchedulePage() {
  const markStore = useMemo(() => createMarkStore(), []);
  const [view, setView] = useState<View>('day');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const now = useCurrentTime();

  const isShowingToday = isSameDate(selectedDate, now);
  const day = getScheduleDay(dayKeyForDate(selectedDate));
  const nowMinutes = isShowingToday ? minutesOfDate(now) : null;

  return (
    <Layout height="fill">
      <LayoutHeader padding={4} hasDivider>
        <Stack direction="vertical" gap={3}>
          <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
            <Heading level={1}>Распорядок дня</Heading>
            {!isShowingToday && (
              <Button
                label="К сегодняшнему дню"
                variant="secondary"
                onClick={() => setSelectedDate(new Date())}
              />
            )}
          </Stack>
          <SegmentedControl
            label="Что показать"
            value={view}
            onChange={(nextView) => setView(nextView === 'week' ? 'week' : 'day')}
          >
            <SegmentedControlItem value="day" label="День" />
            <SegmentedControlItem value="week" label="Неделя" />
          </SegmentedControl>
        </Stack>
      </LayoutHeader>

      <LayoutContent padding={0} role="main">
        {view === 'day' ? (
          <DayView
            day={day}
            date={selectedDate}
            nowMinutes={nowMinutes}
            store={markStore}
          />
        ) : (
          <WeekView
            weekStart={startOfWeek(selectedDate)}
            today={now}
            store={markStore}
            onOpenDay={(date) => {
              setSelectedDate(date);
              setView('day');
            }}
          />
        )}
      </LayoutContent>
    </Layout>
  );
}
