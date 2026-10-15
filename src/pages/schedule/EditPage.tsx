import {useEffect, useMemo, useState} from 'react';

import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Divider} from '@astryxdesign/core/Divider';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Layout, LayoutContent, Stack} from '@astryxdesign/core/Layout';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Section} from '@astryxdesign/core/Section';
import {Selector, SelectorOption} from '@astryxdesign/core/Selector';
import {Switch} from '@astryxdesign/core/Switch';
import {Heading, Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Trash2} from 'lucide-react';

import {getIconNames, resolveIcon} from '../../icons';
import {DAY_KEYS, timeToMinutes, type DayKey, type EntryKind, type ScheduleDay} from '../../schedule';
import {ENTRY_KIND_OPTIONS, validateDrafts, type DraftEntry} from '../../scheduleRules';
import {deleteEntry, saveEntry} from '../../scheduleStore';

type EditPageProps = {
  /** The loaded schedule, one entry per week day. */
  week: ScheduleDay[];
  /** Called after a successful save, so the views can reload. */
  onSaved: () => void;
  /** Leave the edit page. */
  onClose: () => void;
};

/** Russian labels for the activity kinds, so the selector reads naturally. */
const KIND_LABELS: Record<EntryKind, string> = {
  routine: 'Режим',
  study: 'Учёба',
  sport: 'Спорт',
  break: 'Перерыв',
  rest: 'Отдых',
  sleep: 'Сон',
};

/** Default length of a freshly added segment, in minutes. */
const NEW_SEGMENT_MINUTES = 30;

/** Default start of a freshly added segment in an empty day. */
const NEW_SEGMENT_START = '09:00';

/**
 * Build the identifier of a new segment from its day and start time.
 *
 * Ids are stable and are what the done marks point at, so they are derived
 * rather than typed. A day-and-time slug is unique enough inside one day, and a
 * numeric suffix keeps two segments that start together apart.
 *
 * @param day Week day the segment belongs to.
 * @param start Start time in `HH:MM`.
 * @param takenIds Ids already used in that day.
 * @returns An identifier no other segment of that day uses.
 */
function buildEntryId(day: DayKey, start: string, takenIds: readonly string[]): string {
  const base = `${day}-${start.replace(':', '')}-new`;
  if (!takenIds.includes(base)) {
    return base;
  }

  let suffix = 2;
  while (takenIds.includes(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

/**
 * Format minutes from midnight as `HH:MM`, clamped to the last minute of a day.
 *
 * @param minutes Minutes from midnight.
 * @returns Time of day.
 */
function formatMinutes(minutes: number): string {
  const clamped = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

/**
 * Turn a loaded segment into the shape the form edits.
 *
 * @param entry Segment of one day.
 * @param day The day it belongs to.
 * @returns The draft.
 */
function toDraft(entry: ScheduleDay['entries'][number], day: DayKey): DraftEntry {
  return {
    id: entry.id,
    day,
    start: entry.start,
    end: entry.end,
    kind: entry.kind,
    icon: entry.icon,
    title: entry.title,
    note: entry.note,
    tracked: entry.tracked,
  };
}

/**
 * The schedule editor: pick a day, change its segments, save them.
 *
 * The form holds one day at a time as drafts, so nothing is written until the
 * editor saves. Every save is checked with the same rules the build and the
 * database enforce, which means a segment this page accepts cannot be one the
 * database later refuses. The unwritten changes are counted, so a day can be
 * reviewed before it is written.
 *
 * @param props The loaded week, the reload callback and the way out.
 * @returns The edit page.
 */
export function EditPage({week, onSaved, onClose}: EditPageProps) {
  const [day, setDay] = useState<DayKey>('mon');
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<DraftEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const iconNames = useMemo(() => getIconNames(), []);
  const kindOptions = useMemo(
    () => ENTRY_KIND_OPTIONS.map((kind) => ({value: kind, label: KIND_LABELS[kind]})),
    [],
  );

  // Load the chosen day into the form in time order, and keep that same set as
  // the saved state, so the unwritten changes can be counted against it.
  useEffect(() => {
    const loaded = (week.find((weekDay) => weekDay.key === day)?.entries ?? [])
      .map((entry) => toDraft(entry, day))
      .sort((left, right) => timeToMinutes(left.start) - timeToMinutes(right.start));
    setDrafts(loaded);
    setSavedDrafts(loaded);
    setError(null);
  }, [day, week]);

  const problems = useMemo(() => validateDrafts(drafts), [drafts]);

  const unsavedCount = useMemo(() => {
    const savedById = new Map(savedDrafts.map((draft) => [draft.id, draft]));
    const currentIds = new Set(drafts.map((draft) => draft.id));
    const removed = savedDrafts.filter((draft) => !currentIds.has(draft.id)).length;
    const changed = drafts.filter((draft) => {
      const saved = savedById.get(draft.id);
      return !saved || JSON.stringify(saved) !== JSON.stringify(draft);
    }).length;
    return removed + changed;
  }, [drafts, savedDrafts]);

  // The icon choice is a name in the data, which reads as nothing to a person,
  // so the dropdown draws the icon itself beside each name. The same renderer
  // serves the closed trigger's value, so the chosen picture stays visible.
  const renderIconOption = (option: {value: string; label?: string}) => {
    const OptionIcon = resolveIcon(option.value);
    return <SelectorOption label={option.label ?? option.value} icon={OptionIcon} />;
  };

  const updateDraft = (index: number, patch: Partial<DraftEntry>) => {
    setDrafts((current) =>
      current.map((draft, draftIndex) => (draftIndex === index ? {...draft, ...patch} : draft)),
    );
  };

  const addDraft = () => {
    const takenIds = drafts.map((draft) => draft.id);
    const lastEnd = drafts.at(-1)?.end;
    const start = lastEnd ?? NEW_SEGMENT_START;

    setDrafts((current) => [
      ...current,
      {
        id: buildEntryId(day, start, takenIds),
        day,
        start,
        end: formatMinutes(timeToMinutes(start) + NEW_SEGMENT_MINUTES),
        kind: 'study',
        icon: 'BookOpen',
        title: '',
        note: '',
        tracked: true,
      },
    ]);
  };

  const removeDraft = (index: number) => {
    setDrafts((current) => current.filter((_, draftIndex) => draftIndex !== index));
  };

  const handleSave = async () => {
    if (problems.length > 0) {
      setError('Сначала исправьте ошибки в форме.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const savedById = new Map(savedDrafts.map((draft) => [draft.id, draft]));
      const currentIds = new Set(drafts.map((draft) => draft.id));

      // Deletions go first: a segment that is gone cannot leave a mark pointing
      // at a row that no longer exists.
      for (const draft of savedDrafts) {
        if (!currentIds.has(draft.id)) {
          await deleteEntry(draft.id);
        }
      }

      for (const draft of drafts) {
        if (JSON.stringify(savedById.get(draft.id)) !== JSON.stringify(draft)) {
          await saveEntry(draft);
        }
      }

      setSavedDrafts(drafts);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить');
    } finally {
      setIsSaving(false);
    }
  };

  const dayLabel = week.find((weekDay) => weekDay.key === day)?.fullLabel ?? day;

  return (
    <Layout height="fill">
      <Section variant="section" padding={4}>
        <Stack direction="vertical" gap={4}>
          <Stack direction="horizontal" gap={3} vAlign="center" justify="between" wrap="wrap">
            <Stack direction="vertical" gap={1}>
              <Heading level={2}>Правка расписания</Heading>
              <Text type="supporting" color="secondary">
                Изменения сохраняются в базу и сразу видны на всех устройствах.
              </Text>
            </Stack>

            <Button label="Вернуться к расписанию" variant="secondary" onClick={onClose} />
          </Stack>

          <SegmentedControl
            label="День недели"
            value={day}
            onChange={(nextDay) => setDay(nextDay as DayKey)}
          >
            {DAY_KEYS.map((dayKey) => (
              <SegmentedControlItem
                key={dayKey}
                value={dayKey}
                label={week.find((weekDay) => weekDay.key === dayKey)?.label ?? dayKey}
              />
            ))}
          </SegmentedControl>

          <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
            <Badge label={`${dayLabel}: ${drafts.length} отрезков`} variant="neutral" />
            {unsavedCount > 0 ? (
              <Badge label={`не сохранено: ${unsavedCount}`} variant="warning" />
            ) : (
              <Badge label="всё сохранено" variant="success" />
            )}
          </Stack>
        </Stack>
      </Section>

      <Divider variant="strong" isFullBleed />

      <LayoutContent padding={0} role="main">
        <Section variant="transparent" padding={4}>
          <Stack direction="vertical" gap={4}>
            {drafts.map((draft, index) => {
              const SegmentIcon = resolveIcon(draft.icon);

              return (
                <Card key={draft.id} variant="default" elevation="low" padding={4}>
                  <Stack direction="vertical" gap={3}>
                    <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
                      <Icon icon={SegmentIcon} size="lg" />
                      <Text type="label" color="secondary">
                        {draft.id}
                      </Text>
                      <IconButton
                        label={`Удалить отрезок: ${draft.title || draft.id}`}
                        tooltip="Удалить отрезок"
                        icon={<Icon icon={Trash2} />}
                        onClick={() => removeDraft(index)}
                      />
                    </Stack>

                    <Stack direction="horizontal" gap={3} wrap="wrap">
                      <TextInput
                        label="Начало"
                        value={draft.start}
                        onChange={(value) => updateDraft(index, {start: value})}
                        placeholder="09:00"
                        width={120}
                      />
                      <TextInput
                        label="Окончание"
                        value={draft.end}
                        onChange={(value) => updateDraft(index, {end: value})}
                        placeholder="10:30"
                        width={120}
                      />
                      <TextInput
                        label="Название"
                        value={draft.title}
                        onChange={(value) => updateDraft(index, {title: value})}
                        width={260}
                      />
                      <TextInput
                        label="Примечание"
                        value={draft.note}
                        onChange={(value) => updateDraft(index, {note: value})}
                        width={260}
                      />
                    </Stack>

                    <Stack direction="horizontal" gap={3} vAlign="end" wrap="wrap">
                      <Selector
                        label="Вид"
                        options={kindOptions}
                        value={draft.kind}
                        onChange={(value) => updateDraft(index, {kind: value as EntryKind})}
                        width={180}
                      />
                      <Selector
                        label="Иконка"
                        options={iconNames}
                        value={draft.icon}
                        onChange={(value) => updateDraft(index, {icon: value})}
                        renderOption={renderIconOption}
                        renderValue={renderIconOption}
                        hasSearch
                        searchPlaceholder="Найти иконку"
                        width={200}
                      />
                      <Switch
                        label="Считать в прогрессе"
                        value={draft.tracked}
                        onChange={(value) => updateDraft(index, {tracked: value})}
                      />
                    </Stack>
                  </Stack>
                </Card>
              );
            })}

            <Stack direction="horizontal" gap={3} wrap="wrap">
              <Button label="Добавить отрезок" variant="secondary" onClick={addDraft} />
              <Button
                label={isSaving ? 'Сохраняем…' : 'Сохранить день'}
                variant="primary"
                isDisabled={isSaving || problems.length > 0 || unsavedCount === 0}
                onClick={() => void handleSave()}
              />
            </Stack>

            {problems.length > 0 ? (
              <Card variant="muted" elevation="low" padding={4}>
                <Stack direction="vertical" gap={2}>
                  <Text type="label" color="secondary">
                    День пока нельзя сохранить:
                  </Text>
                  {problems.map((problem) => (
                    <Text key={problem} type="supporting" color="secondary">
                      {problem}
                    </Text>
                  ))}
                </Stack>
              </Card>
            ) : null}

            {error ? (
              <Text type="supporting" color="secondary">
                {error}
              </Text>
            ) : null}
          </Stack>
        </Section>
      </LayoutContent>
    </Layout>
  );
}
