import {useMemo, useState} from 'react';

import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Icon} from '@astryxdesign/core/Icon';
import {Layout, LayoutContent, LayoutHeader, Stack} from '@astryxdesign/core/Layout';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Heading} from '@astryxdesign/core/Text';
import {Moon, Sun} from 'lucide-react';

import {DayView} from '../../components/DayView';
import {WeekView} from '../../components/WeekView';
import {createMarkStore} from '../../marks';
import {dayKeyForDate, getScheduleDay, isSameDate, minutesOfDate, startOfWeek} from '../../schedule';
import type {ThemeMode} from '../../themeMode';
import {useCurrentTime} from '../../useCurrentTime';

/** The two views the page switches between. */
type View = 'day' | 'week';

type SchedulePageProps = {
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
};

/**
 * Schedule page: the current day on top, the week behind a switch.
 *
 * The page owns the selected date and the running clock, so both views read the
 * same moment: the day view greys out what already passed and the week view
 * marks today. Opening a day from the week switches back to the day view.
 *
 * The header is an accent card, which gives the page the coloured top the design
 * calls for without a colour override anywhere else.
 *
 * @param props Colour mode and its setter, owned by the app root.
 * @returns The page.
 */
export default function SchedulePage({mode, onModeChange}: SchedulePageProps) {
  const markStore = useMemo(() => createMarkStore(), []);
  const [view, setView] = useState<View>('day');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const now = useCurrentTime();

  const isShowingToday = isSameDate(selectedDate, now);
  const day = getScheduleDay(dayKeyForDate(selectedDate));
  const nowMinutes = isShowingToday ? minutesOfDate(now) : null;

  return (
    <Layout height="fill">
      <LayoutHeader padding={4}>
        <Card variant="purple" elevation="low" padding={5}>
          <Stack direction="vertical" gap={4}>
            <Stack direction="horizontal" gap={4} vAlign="center" justify="between" wrap="wrap">
              <Heading level={1}>Распорядок дня</Heading>

              <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
                {!isShowingToday && (
                  <Button
                    label="К сегодняшнему дню"
                    variant="secondary"
                    onClick={() => setSelectedDate(new Date())}
                  />
                )}

                <SegmentedControl
                  label="Тема оформления"
                  value={mode}
                  onChange={(nextMode) => onModeChange(nextMode === 'dark' ? 'dark' : 'light')}
                >
                  <SegmentedControlItem
                    value="light"
                    label="Светлая тема"
                    icon={<Icon icon={Sun} size="sm" />}
                    isLabelHidden
                  />
                  <SegmentedControlItem
                    value="dark"
                    label="Тёмная тема"
                    icon={<Icon icon={Moon} size="sm" />}
                    isLabelHidden
                  />
                </SegmentedControl>
              </Stack>
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
        </Card>
      </LayoutHeader>

      <LayoutContent padding={0} role="main">
        {view === 'day' ? (
          <DayView day={day} date={selectedDate} nowMinutes={nowMinutes} store={markStore} />
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
