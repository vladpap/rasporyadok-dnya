import {useMemo, useState} from 'react';

import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Icon} from '@astryxdesign/core/Icon';
import {Layout, LayoutContent, LayoutHeader, Stack} from '@astryxdesign/core/Layout';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Section} from '@astryxdesign/core/Section';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Moon, Sun} from 'lucide-react';

import {DayView} from '../../components/DayView';
import {MonthView} from '../../components/MonthView';
import {SignInDialog} from '../../components/SignInDialog';
import {WeekView} from '../../components/WeekView';
import {createMarkStore} from '../../marks';
import {dayKeyForDate, isSameDate, startOfWeek} from '../../schedule';
import type {ThemeMode} from '../../themeMode';
import {useAuth} from '../../useAuth';
import {useCurrentTime} from '../../useCurrentTime';
import {findDay, useSchedule} from '../../useSchedule';

/** The three views the page switches between. */
type View = 'day' | 'week' | 'month';

type SchedulePageProps = {
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
};

/**
 * Schedule page: the current day on top, the week and the month behind a switch.
 *
 * The schedule is read from Supabase on start, so the page has three states: a
 * short loading state, an error state with a retry, and the views themselves.
 * The page owns the selected date and the running clock, so every view reads the
 * same moment: the day view greys out what already passed and the week view
 * marks today. Opening a day from the week or the month switches to the day view.
 *
 * The header is an accent card, which gives the page the coloured top the design
 * calls for without a colour override anywhere else. It also carries the one
 * quiet sign in control, because reading the schedule is public while editing it
 * is not.
 *
 * @param props Colour mode and its setter, owned by the app root.
 * @returns The page.
 */
export default function SchedulePage({mode, onModeChange}: SchedulePageProps) {
  const markStore = useMemo(() => createMarkStore(), []);
  const {week, isLoading, error, reload} = useSchedule();
  const {email, signIn, signOut} = useAuth();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [view, setView] = useState<View>('day');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const now = useCurrentTime();

  const isShowingToday = isSameDate(selectedDate, now);
  const day = findDay(week, dayKeyForDate(selectedDate));

  // The sign in dialog lives with the header rather than with the views, so it
  // stays reachable while the schedule is still loading or has failed.
  const header = (
    <>
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

                {/* Editing is for the editor alone, so the entry point is one
                    quiet button: it names who is signed in and offers the way in
                    or out. The child following the schedule never needs it. */}
                {email ? (
                  <Button
                    label={`Выйти (${email})`}
                    variant="ghost"
                    onClick={() => void signOut()}
                  />
                ) : (
                  <Button
                    label="Войти"
                    variant="ghost"
                    onClick={() => setIsSignInOpen(true)}
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
              onChange={(nextView) =>
                setView(nextView === 'week' ? 'week' : nextView === 'month' ? 'month' : 'day')
              }
            >
              <SegmentedControlItem value="day" label="День" />
              <SegmentedControlItem value="week" label="Неделя" />
              <SegmentedControlItem value="month" label="Месяц" />
            </SegmentedControl>
          </Stack>
        </Card>
      </LayoutHeader>

      <SignInDialog
        isOpen={isSignInOpen}
        onOpenChange={setIsSignInOpen}
        onSignIn={signIn}
      />
    </>
  );

  // The schedule is not available until the first read finishes, so state is
  // shown instead of an empty page: a short load, or the reason it failed with
  // a way to try again.
  if (error) {
    return (
      <Layout height="fill">
        {header}
        <LayoutContent padding={0} role="main">
          <Section variant="section" padding={4}>
            <Stack direction="vertical" gap={3}>
              <Heading level={2}>Не удалось показать расписание</Heading>
              <Text type="body" color="secondary">
                {error}
              </Text>
              <Button label="Попробовать снова" onClick={reload} />
            </Stack>
          </Section>
        </LayoutContent>
      </Layout>
    );
  }

  if (isLoading || !week || !day) {
    return (
      <Layout height="fill">
        {header}
        <LayoutContent padding={0} role="main">
          <Section variant="section" padding={4}>
            <Text type="body" color="secondary">
              Загружаем расписание…
            </Text>
          </Section>
        </LayoutContent>
      </Layout>
    );
  }

  return (
    <Layout height="fill">
      {header}

      <LayoutContent padding={0} role="main">
        {view === 'day' ? (
          <DayView day={day} date={selectedDate} now={now} store={markStore} />
        ) : view === 'week' ? (
          <WeekView
            weekStart={startOfWeek(selectedDate)}
            week={week}
            today={now}
            store={markStore}
            onOpenDay={(date) => {
              setSelectedDate(date);
              setView('day');
            }}
          />
        ) : (
          <MonthView
            monthAnchor={selectedDate}
            week={week}
            today={now}
            store={markStore}
            onNavigateMonth={setSelectedDate}
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
