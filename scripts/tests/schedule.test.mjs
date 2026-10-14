/**
 * Tests for the CSV helpers and the schedule validation rules.
 *
 * Run with: node --test scripts/tests
 *
 * The last test reads the shipped `data/schedule.csv`, so a broken edit of the
 * real schedule fails in CI before it reaches the site.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import { formatCsv, formatCsvRow, parseCsv } from '../lib/csv.mjs';
import {
  ENTRY_FIELDS,
  createEntry,
  minutesToTime,
  summarizeDay,
  timeToMinutes,
  validateEntries,
  validateSchedule,
} from '../lib/schedule-schema.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Build one schedule entry with sensible defaults.
 *
 * @param {object} [overrides] Fields to replace.
 * @returns {ReturnType<typeof createEntry>} Schedule entry.
 */
function makeEntry(overrides = {}) {
  return {
    day: 'mon',
    id: 'mon-0900-math',
    start: '09:00',
    end: '10:30',
    kind: 'study',
    icon: 'Calculator',
    title: 'Математика',
    note: '',
    tracked: true,
    ...overrides,
  };
}

/**
 * Read the shipped schedule source and turn it into entries.
 *
 * @returns {ReturnType<typeof createEntry>[]} Schedule entries.
 */
function readShippedEntries() {
  const rows = parseCsv(readFileSync(join(projectRoot, 'data', 'schedule.csv'), 'utf8'));
  const [header, ...dataRows] = rows;
  assert.deepEqual(header, ENTRY_FIELDS);
  return dataRows.map((fields) =>
    createEntry(Object.fromEntries(ENTRY_FIELDS.map((name, index) => [name, fields[index] ?? '']))),
  );
}

describe('parseCsv', () => {
  it('keeps commas inside quoted fields and unescapes doubled quotes', () => {
    const rows = parseCsv('a,"Домашние задания, разбор ошибок","Он сказал ""да"""\n');
    assert.deepEqual(rows, [['a', 'Домашние задания, разбор ошибок', 'Он сказал "да"']]);
  });

  it('handles CRLF line endings and skips blank lines', () => {
    const rows = parseCsv('day,id\r\nmon,mon-0730-rise\r\n\r\nsun,sun-0900-rise\r\n');
    assert.deepEqual(rows, [
      ['day', 'id'],
      ['mon', 'mon-0730-rise'],
      ['sun', 'sun-0900-rise'],
    ]);
  });

  it('trims unquoted fields but keeps quoted content as written', () => {
    const rows = parseCsv('  mon , " Пробел внутри " \n');
    assert.deepEqual(rows, [['mon', ' Пробел внутри ']]);
  });
});

describe('formatCsvRow', () => {
  it('quotes only the fields that need it', () => {
    assert.equal(formatCsvRow(['mon', 'Перерыв', '', 'no']), 'mon,Перерыв,,no');
    assert.equal(formatCsvRow(['mon', 'Обед, отдых', 'no']), 'mon,"Обед, отдых",no');
  });

  it('round-trips a document through formatCsv and parseCsv', () => {
    const rows = [
      ['day', 'title'],
      ['mon', 'Ужин, свободное время'],
      ['tue', 'Он сказал "да"'],
    ];
    assert.deepEqual(parseCsv(formatCsv(rows)), rows);
  });
});

describe('time helpers', () => {
  it('converts between HH:MM and minutes from midnight', () => {
    assert.equal(timeToMinutes('07:30'), 450);
    assert.equal(minutesToTime(450), '07:30');
    assert.equal(minutesToTime(0), '00:00');
  });

  it('rejects values that are not times of day', () => {
    assert.ok(Number.isNaN(timeToMinutes('7:30')));
    assert.ok(Number.isNaN(timeToMinutes('24:00')));
    assert.ok(Number.isNaN(timeToMinutes('')));
  });
});

describe('validateEntries', () => {
  it('reports an overlap inside one day', () => {
    const { errors } = validateEntries([
      makeEntry(),
      makeEntry({ id: 'mon-1000-english', start: '10:00', end: '11:00', title: 'Английский' }),
    ]);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /пересекается/);
  });

  it('reports an end that is not later than the start', () => {
    const { errors } = validateEntries([makeEntry({ start: '10:30', end: '10:30' })]);
    assert.ok(errors.some((message) => /не позже начала/.test(message)));
  });

  it('reports a repeated id and a mismatched day prefix', () => {
    const { errors } = validateEntries([
      makeEntry(),
      makeEntry({ start: '11:00', end: '12:00' }),
      makeEntry({ id: 'tue-0900-math', start: '12:00', end: '13:00' }),
    ]);
    assert.ok(errors.some((message) => /id повторяется/.test(message)));
    assert.ok(errors.some((message) => /id должен начинаться/.test(message)));
  });

  it('reports an unknown kind and an empty title', () => {
    const { errors } = validateEntries([makeEntry({ kind: 'hobby', title: '  ' })]);
    assert.ok(errors.some((message) => /неизвестный вид/.test(message)));
    assert.ok(errors.some((message) => /пустое название/.test(message)));
  });

  it('reports an icon that is not a component name', () => {
    const { errors } = validateEntries([makeEntry({ icon: 'dumbbell' })]);
    assert.ok(errors.some((message) => /иконка/.test(message)));
  });

  it('accepts the schedule that ships with the project', () => {
    const { errors } = validateSchedule(readShippedEntries());
    assert.deepEqual(errors, []);
  });
});

describe('validateSchedule', () => {
  it('reports a day without entries', () => {
    const { errors } = validateSchedule([makeEntry()]);
    assert.equal(errors.length, 6);
    assert.ok(errors.every((message) => /нет ни одной записи/.test(message)));
  });
});

describe('summarizeDay', () => {
  it('counts entries, tracked entries and uncovered spans', () => {
    const summary = summarizeDay([
      makeEntry({ id: 'mon-0730-rise', start: '07:30', end: '08:00', kind: 'routine', title: 'Подъём', tracked: false }),
      makeEntry(),
      makeEntry({ id: 'mon-1100-english', start: '11:00', end: '12:00', title: 'Английский' }),
    ]);

    assert.equal(summary.entryCount, 3);
    assert.equal(summary.trackedCount, 2);
    assert.equal(summary.plannedMinutes, 30 + 90 + 60);
    assert.equal(summary.trackedMinutes, 90 + 60);
    assert.deepEqual(summary.gaps, [
      { from: '08:00', to: '09:00', minutes: 60 },
      { from: '10:30', to: '11:00', minutes: 30 },
    ]);
  });
});
