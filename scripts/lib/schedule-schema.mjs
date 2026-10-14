/**
 * Schema, validation and coverage analysis for the normalized schedule.
 *
 * The schedule lives in one CSV row per time segment. This module knows the
 * column names, the allowed values and the rules a row must satisfy, so the
 * build script and the tests share exactly one definition of "valid".
 */

/** Column names of the schedule CSV, in file order. */
export const ENTRY_FIELDS = ['day', 'id', 'start', 'end', 'kind', 'title', 'note', 'tracked'];

/** Activity kinds. `tracked` rows count toward the daily progress. */
export const ENTRY_KINDS = ['routine', 'study', 'sport', 'break', 'rest', 'sleep'];

/**
 * Week days in display order.
 * `key` is used in ids and in generated JSON, `label` is the short Russian
 * name and `fullLabel` the one used as a page heading.
 */
export const DAY_DEFINITIONS = [
  { key: 'mon', label: 'Пн', fullLabel: 'Понедельник' },
  { key: 'tue', label: 'Вт', fullLabel: 'Вторник' },
  { key: 'wed', label: 'Ср', fullLabel: 'Среда' },
  { key: 'thu', label: 'Чт', fullLabel: 'Четверг' },
  { key: 'fri', label: 'Пт', fullLabel: 'Пятница' },
  { key: 'sat', label: 'Сб', fullLabel: 'Суббота' },
  { key: 'sun', label: 'Вс', fullLabel: 'Воскресенье' },
];

/** Minutes in one day, used to convert `HH:MM` into a sortable number. */
export const MINUTES_PER_DAY = 24 * 60;

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Convert `HH:MM` into minutes from midnight.
 *
 * @param {string} time Time of day.
 * @returns {number} Minutes from midnight, or NaN when the format is wrong.
 */
export function timeToMinutes(time) {
  if (typeof time !== 'string' || !TIME_PATTERN.test(time)) {
    return Number.NaN;
  }
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight back into `HH:MM`.
 *
 * @param {number} minutes Minutes from midnight.
 * @returns {string} Time of day.
 */
export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/**
 * Turn one CSV row into a schedule entry object.
 *
 * The result keeps raw strings for the time fields, because the web
 * application compares them after converting with `timeToMinutes`.
 *
 * @param {Record<string, string>} record Values keyed by column name.
 * @returns {{day: string, id: string, start: string, end: string, kind: string,
 *   title: string, note: string, tracked: boolean}} Schedule entry.
 */
export function createEntry(record) {
  return {
    day: record.day ?? '',
    id: record.id ?? '',
    start: record.start ?? '',
    end: record.end ?? '',
    kind: record.kind ?? '',
    title: record.title ?? '',
    note: record.note ?? '',
    tracked: record.tracked === 'yes',
  };
}

/**
 * Check every rule that a single row must satisfy, plus the rule that rows of
 * one day must not share time.
 *
 * Errors stop the build; warnings are printed but pass.
 *
 * @param {readonly ReturnType<typeof createEntry>[]} entries Schedule entries.
 * @returns {{errors: string[], warnings: string[]}} Validation result.
 */
export function validateEntries(entries) {
  const errors = [];
  const warnings = [];
  const knownDays = new Set(DAY_DEFINITIONS.map((day) => day.key));
  const seenIds = new Map();
  const entriesByDay = new Map();

  for (const entry of entries) {
    const where = entry.id || `${entry.day} ${entry.start}`;

    if (!knownDays.has(entry.day)) {
      errors.push(`${where}: неизвестный день "${entry.day}"`);
    } else if (!entry.id.startsWith(`${entry.day}-`)) {
      errors.push(`${where}: id должен начинаться с ключа дня "${entry.day}-"`);
    }

    if (!ID_PATTERN.test(entry.id)) {
      errors.push(`${where}: id должен состоять из строчных латинских букв, цифр и дефисов`);
    }

    if (seenIds.has(entry.id)) {
      errors.push(`${where}: id повторяется (${seenIds.get(entry.id)} и ${entry.start})`);
    } else {
      seenIds.set(entry.id, entry.start);
    }

    if (!TIME_PATTERN.test(entry.start)) {
      errors.push(`${where}: время начала "${entry.start}" не в формате HH:MM`);
    }
    if (!TIME_PATTERN.test(entry.end)) {
      errors.push(`${where}: время окончания "${entry.end}" не в формате HH:MM`);
    }

    const startMinutes = timeToMinutes(entry.start);
    const endMinutes = timeToMinutes(entry.end);
    if (!Number.isNaN(startMinutes) && !Number.isNaN(endMinutes) && endMinutes <= startMinutes) {
      errors.push(`${where}: окончание ${entry.end} не позже начала ${entry.start}`);
    }

    if (!ENTRY_KINDS.includes(entry.kind)) {
      errors.push(`${where}: неизвестный вид "${entry.kind}", допустимы ${ENTRY_KINDS.join(', ')}`);
    }

    if (entry.title.trim() === '') {
      errors.push(`${where}: пустое название`);
    }

    const dayEntries = entriesByDay.get(entry.day) ?? [];
    dayEntries.push(entry);
    entriesByDay.set(entry.day, dayEntries);
  }

  for (const { key } of DAY_DEFINITIONS) {
    const dayEntries = entriesByDay.get(key) ?? [];
    if (dayEntries.length > 0) {
      errors.push(...findOverlaps(dayEntries));
    }
  }

  return { errors, warnings };
}

/**
 * Check the whole schedule: every row rule plus the requirement that all seven
 * days carry at least one entry.
 *
 * @param {readonly ReturnType<typeof createEntry>[]} entries Schedule entries.
 * @returns {{errors: string[], warnings: string[]}} Validation result.
 */
export function validateSchedule(entries) {
  const { errors, warnings } = validateEntries(entries);
  const daysWithEntries = new Set(entries.map((entry) => entry.day));

  for (const { key, label } of DAY_DEFINITIONS) {
    if (!daysWithEntries.has(key)) {
      errors.push(`${label}: нет ни одной записи`);
    }
  }

  return { errors, warnings };
}

/**
 * Find entries that share time inside one day.
 *
 * @param {readonly ReturnType<typeof createEntry>[]} dayEntries Entries of one day.
 * @returns {string[]} One message per overlap.
 */
function findOverlaps(dayEntries) {
  const problems = [];
  const sorted = [...dayEntries].sort(
    (left, right) => timeToMinutes(left.start) - timeToMinutes(right.start),
  );

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (timeToMinutes(current.start) < timeToMinutes(previous.end)) {
      problems.push(
        `${current.day}: "${previous.title}" (${previous.start}-${previous.end}) `
          + `пересекается с "${current.title}" (${current.start}-${current.end})`,
      );
    }
  }

  return problems;
}

/**
 * Describe one day: how many entries it has, how much time they plan and
 * which spans of the planned window stay uncovered.
 *
 * @param {readonly ReturnType<typeof createEntry>[]} dayEntries Entries of one day.
 * @returns {{entryCount: number, trackedCount: number, plannedMinutes: number,
 *   trackedMinutes: number, firstStart: string, lastEnd: string,
 *   gaps: Array<{from: string, to: string, minutes: number}>}} Day summary.
 */
export function summarizeDay(dayEntries) {
  const sorted = [...dayEntries].sort(
    (left, right) => timeToMinutes(left.start) - timeToMinutes(right.start),
  );

  let plannedMinutes = 0;
  let trackedMinutes = 0;
  let trackedCount = 0;
  const gaps = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const entry = sorted[index];
    const duration = timeToMinutes(entry.end) - timeToMinutes(entry.start);
    plannedMinutes += duration;
    if (entry.tracked) {
      trackedCount += 1;
      trackedMinutes += duration;
    }

    const next = sorted[index + 1];
    if (next) {
      const uncovered = timeToMinutes(next.start) - timeToMinutes(entry.end);
      if (uncovered > 0) {
        gaps.push({
          from: entry.end,
          to: next.start,
          minutes: uncovered,
        });
      }
    }
  }

  return {
    entryCount: sorted.length,
    trackedCount,
    plannedMinutes,
    trackedMinutes,
    firstStart: sorted[0]?.start ?? '',
    lastEnd: sorted.at(-1)?.end ?? '',
    gaps,
  };
}

/**
 * Format a duration in minutes as Russian text, for console reports.
 *
 * @param {number} minutes Duration.
 * @returns {string} For example `9 ч 30 мин`.
 */
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest} мин`;
  }
  return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`;
}
