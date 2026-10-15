#!/usr/bin/env node
/**
 * Load `data/schedule.csv` into the Supabase `schedule` table.
 *
 * This is a one-off migration: the CSV was the source of truth while the app read
 * a generated JSON file, and the table is the source of truth now. The script
 * signs in as the editor first, because row level security lets only signed in
 * users write, then upserts every row by its stable id.
 *
 * Credentials come from the environment and are never committed:
 *   SUPABASE_EMAIL, SUPABASE_PASSWORD
 *
 * Usage:
 *   SUPABASE_EMAIL=... SUPABASE_PASSWORD=... node scripts/import-schedule.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

import { parseCsv } from './lib/csv.mjs';
import { ENTRY_FIELDS, createEntry, validateSchedule } from './lib/schedule-schema.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(projectRoot, 'data', 'schedule.csv');

const SUPABASE_URL = process.env.SUPABASE_URL
  ?? 'https://wglfgvtzlrjqjhjfyyoz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbGZndnR6bHJqcWpoamZ5eW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NjkzMDcsImV4cCI6MjEwNzU0NTMwN30.aik9SGUaZDYhttT1obgdI1EqREenuPqpnSe_3Lr4lkI';

/**
 * Read the CSV source and turn it into schedule entries.
 *
 * The same validation the build used runs here, so a broken CSV cannot reach
 * the database.
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

/** Entry point: validate the CSV, sign in and upsert every row. */
async function main() {
  const email = process.env.SUPABASE_EMAIL;
  const password = process.env.SUPABASE_PASSWORD;
  if (!email || !password) {
    console.error('Нужны SUPABASE_EMAIL и SUPABASE_PASSWORD в окружении.');
    process.exitCode = 1;
    return;
  }

  const entries = readEntries();
  const { errors, warnings } = validateSchedule(entries);

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

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error(`Не удалось войти как ${email}: ${authError.message}`);
    process.exitCode = 1;
    return;
  }

  const rows = entries.map((entry, index) => ({
    id: entry.id,
    day: entry.day,
    start_time: entry.start,
    end_time: entry.end,
    kind: entry.kind,
    icon: entry.icon,
    title: entry.title,
    note: entry.note,
    tracked: entry.tracked,
    sort_order: index,
  }));

  const { error: upsertError } = await supabase.from('schedule').upsert(rows);
  if (upsertError) {
    console.error(`Не удалось записать расписание: ${upsertError.message}`);
    process.exitCode = 1;
    return;
  }

  const { count, error: countError } = await supabase
    .from('schedule')
    .select('id', { count: 'exact', head: true });
  if (countError) {
    console.error(`Запись прошла, но пересчитать строки не удалось: ${countError.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Импортировано ${rows.length} отрезков из ${relative(projectRoot, sourcePath)}.`);
  console.log(`В таблице schedule теперь ${count} строк.`);

  await supabase.auth.signOut();
}

await main();
