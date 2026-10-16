import {Suspense, lazy, useMemo, useState} from 'react';

import {Avatar} from '@astryxdesign/core/Avatar';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Icon} from '@astryxdesign/core/Icon';
import {Stack} from '@astryxdesign/core/Layout';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Section} from '@astryxdesign/core/Section';
import {Heading, Text} from '@astryxdesign/core/Text';
import {CircleHelp, Moon, Sun} from 'lucide-react';

import {DayView} from '../../components/DayView';
import {MonthView} from '../../components/MonthView';
import {SignInDialog} from '../../components/SignInDialog';
import {ThemePicker} from '../../components/ThemePicker';
import {WeekView} from '../../components/WeekView';
import {createMarkStore} from '../../marks';
import {dayKeyForDate, startOfWeek} from '../../schedule';
import type {ThemeKey} from '../../themes';
import type {ThemeMode} from '../../themeMode';
import {useAuth} from '../../useAuth';
import {useCurrentTime} from '../../useCurrentTime';
import {findDay, useSchedule} from '../../useSchedule';

// The editor is an editor's tool: a child following the schedule never opens it,
// so its form controls load on demand instead of shipping in the first bundle.
const EditPage = lazy(() =>
  import('./EditPage').then((module) => ({default: module.EditPage})),
);

/** The views the page switches between. `edit` is only offered when signed in. */
type View = 'day' | 'week' | 'month' | 'edit';

type SchedulePageProps = {
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
  /** The chosen colour theme. */
  themeKey: ThemeKey;
  /** Choose another colour theme. */
  onThemeKeyChange: (key: ThemeKey) => void;
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
export default function SchedulePage({
  mode,
  onModeChange,
  themeKey,
  onThemeKeyChange,
}: SchedulePageProps) {
  const markStore = useMemo(() => createMarkStore(), []);
  const {week, isLoading, error, reload} = useSchedule();
  const {email, avatarUrl, canEdit, signIn, signInWithGoogle, signOut} = useAuth();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [view, setView] = useState<View>('day');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const now = useCurrentTime();

  const day = findDay(week, dayKeyForDate(selectedDate));

  // The sign in dialog lives with the header rather than with the views, so it
  // stays reachable while the schedule is still loading or has failed. The
  // header is a section rather than a LayoutHeader, because AppShell already
  // owns the page frame and the scroll region: a nested Layout here would add a
  // second scroll container and a second main landmark.
  const header = (
    <>
      <Section variant="section" padding={4}>
        <Card variant="accent" elevation="low" padding={5}>
          <Stack direction="vertical" gap={4}>
            <Stack direction="horizontal" gap={4} vAlign="center" justify="between" wrap="wrap">
              <Heading level={1}>Распорядок дня</Heading>

              <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
                {/* The way back to today sits with the day heading itself, where
                    the date is changed, rather than up here with the appearance
                    controls. */}

                {/* The editor controls belong to the editor alone. A signed in
                    visitor who is not on the editors list is told so rather than
                    shown a button the database would refuse. */}
                {canEdit ? (
                  <Button
                    label={view === 'edit' ? 'К расписанию' : 'Правка расписания'}
                    variant="secondary"
                    onClick={() => setView(view === 'edit' ? 'day' : 'edit')}
                  />
                ) : null}

                {email && !canEdit ? (
                  <Text type="supporting" color="secondary">
                    Правка недоступна для этого аккаунта
                  </Text>
                ) : null}

                {/* The signed in identity is one control: the avatar carries the
                    person, and pressing it signs out. A Google account brings
                    its photo; a password account has none, so the avatar falls
                    back to its default figure and the email is spelled out,
                    which is the only case where the address is worth showing. */}
                {email ? (
                  <Stack direction="horizontal" gap={2} vAlign="center">
                    <Avatar
                      src={avatarUrl ?? undefined}
                      name={avatarUrl ? email : undefined}
                      size="sm"
                      tooltip={`Выйти: ${email}`}
                      onClick={() => void signOut()}
                    />
                    {avatarUrl ? null : (
                      <Text type="supporting" color="secondary">
                        {email}
                      </Text>
                    )}
                  </Stack>
                ) : (
                  <Button
                    label="Войти"
                    variant="ghost"
                    icon={<Icon icon={CircleHelp} size="sm" />}
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

                {/* The gear sits with the light and dark switch, because both
                    answer the same question about how the page looks. */}
                <ThemePicker themeKey={themeKey} onChange={onThemeKeyChange} />
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
      </Section>

      <SignInDialog
        isOpen={isSignInOpen}
        onOpenChange={setIsSignInOpen}
        onSignIn={signIn}
        onSignInWithGoogle={signInWithGoogle}
      />
    </>
  );

  // The schedule is not available until the first read finishes, so state is
  // shown instead of an empty page: a short load, or the reason it failed with
  // a way to try again.
  if (error) {
    return (
      <>
        {header}
        <Section variant="section" padding={4}>
          <Stack direction="vertical" gap={3}>
            <Heading level={2}>Не удалось показать расписание</Heading>
            <Text type="body" color="secondary">
              {error}
            </Text>
            <Button label="Попробовать снова" onClick={reload} />
          </Stack>
        </Section>
      </>
    );
  }

  if (isLoading || !week || !day) {
    return (
      <>
        {header}
        <Section variant="section" padding={4}>
          <Text type="body" color="secondary">
            Загружаем расписание…
          </Text>
        </Section>
      </>
    );
  }

  return (
    <>
      {header}

      {view === 'edit' ? (
        <Suspense
          fallback={
            <Section variant="section" padding={4}>
              <Text type="body" color="secondary">
                Открываем редактор…
              </Text>
            </Section>
          }
        >
          <EditPage week={week} onSaved={reload} onClose={() => setView('day')} />
        </Suspense>
      ) : view === 'day' ? (
        <DayView
            day={day}
            date={selectedDate}
            now={now}
            store={markStore}
            onSelectDate={setSelectedDate}
          />
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
    </>
  );
}
