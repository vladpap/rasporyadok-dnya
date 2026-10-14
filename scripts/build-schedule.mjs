#!/usr/bin/env node
/**
 * Build the machine readable schedule from the hand edited CSV source.
 *
 * The script reads `data/schedule.csv`, validates every row, prints a per day
 * report and writes `data/schedule.json` for the web application. With
 * `--check` it validates without writing, which is what CI uses to stop a
 * broken schedule from being deployed.
 *
 * Usage:
 *   node scripts/build-schedule.mjs
 *   node scripts/build-schedule.mjs --check
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseCsv } from './lib/csv.mjs';
import {
  DAY_DEFINITIONS,
  ENTRY_FIELDS,
  createEntry,
  formatDuration,
  summarizeDay,
  validateSchedule,
} from './lib/schedule-schema.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(projectRoot, 'data', 'schedule.csv');
const outputPath = join(projectRoot, 'data', 'schedule.json');

/** Bump when the generated JSON shape changes. */
const SCHEMA_VERSION = 1;

const shouldOnlyCheck = process.argv.includes('--check');

/**
 * Read and parse the CSV source into schedule entries.
 *
 * @returns {ReturnType<typeof createEntry>[]} Schedule entries in file order.
 */
function readEntries() {
  const rows = parseCsv(readFileSync(sourcePath, 'utf8'));
  if (rows.length === 0) {
    throw new Error(`${relative(projectRoot, sourcePath)}: файл пуст`);
  }

  const [header, ...dataRows] = rows;
  const expectedHeader = ENTRY_FIELDS.join(',');
  if (header.join(',') !== expectedHeader) {
    throw new Error(
      `${relative(projectRoot, sourcePath)}: ожидались колонки "${expectedHeader}", `
        + `а найдены "${header.join(',')}"`,
    );
  }

  return dataRows.map((fields) => {
    const record = Object.fromEntries(
      ENTRY_FIELDS.map((fieldName, index) => [fieldName, fields[index] ?? '']),
    );
    return createEntry(record);
  });
}

/**
 * Build the JSON document the web application imports.
 *
 * @param {ReturnType<typeof createEntry>[]} entries Schedule entries.
 * @returns {object} Serialisable schedule document.
 */
function createScheduleDocument(entries) {
  return {
    version: SCHEMA_VERSION,
    generatedFrom: relative(projectRoot, sourcePath),
    days: DAY_DEFINITIONS.map(({ key, label, fullLabel }) => ({
      key,
      label,
      fullLabel,
      entries: entries
        .filter((entry) => entry.day === key)
        .sort((left, right) => left.start.localeCompare(right.start))
        // The day key is already the group key, so it is left out of the entry.
        .map((entry) => ({
          id: entry.id,
          start: entry.start,
          end: entry.end,
          kind: entry.kind,
          title: entry.title,
          note: entry.note,
          tracked: entry.tracked,
        })),
    })),
  };
}

/** Print one line per day with counts, planned time and uncovered spans. */
function printReport(entries) {
  for (const { key, label, fullLabel } of DAY_DEFINITIONS) {
    const dayEntries = entries.filter((entry) => entry.day === key);
    if (dayEntries.length === 0) {
      continue;
    }

    const summary = summarizeDay(dayEntries);
    console.log(
      `${label} (${fullLabel}): ${summary.entryCount} записей, `
        + `${summary.trackedCount} с отметкой, `
        + `окно ${summary.firstStart}-${summary.lastEnd}, `
        + `план ${formatDuration(summary.plannedMinutes)}, `
        + `в счёте ${formatDuration(summary.trackedMinutes)}`,
    );

    for (const gap of summary.gaps) {
      console.warn(`  разрыв ${gap.from}-${gap.to} (${formatDuration(gap.minutes)})`);
    }
  }
}

/** Entry point: validate the source and write the generated JSON. */
function main() {
  const entries = readEntries();
  const { errors, warnings } = validateSchedule(entries);

  console.log(`Источник: ${relative(projectRoot, sourcePath)} — ${entries.length} записей`);

  for (const warning of warnings) {
    console.warn(`Предупреждение: ${warning}`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`Ошибка: ${error}`);
    }
    console.error(`Проверка не пройдена: ${errors.length} ошибок`);
    process.exitCode = 1;
    return;
  }

  printReport(entries);

  if (shouldOnlyCheck) {
    console.log('Проверка пройдена. Файл не перезаписывался (--check).');
    return;
  }

  const document = createScheduleDocument(entries);
  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  console.log(`Записано: ${relative(projectRoot, outputPath)}`);
}

main();
