/**
 * The schedule rules, shared with the build scripts.
 *
 * `src/lib/schedule-schema.mjs` is the single definition of what a valid segment
 * is, and it is plain ESM, so both the Node scripts and the browser import it as
 * is. This module gives it types and a narrow surface for the edit page, which
 * means a segment the editor accepts is a segment the database and the build
 * accept: there is no second copy of the rules to drift.
 */

import {ENTRY_KINDS, validateEntries} from './lib/schedule-schema.mjs';

import type {DayKey, EntryKind} from './schedule';

/** Activity kinds offered by the edit page, in the order the data defines. */
export const ENTRY_KIND_OPTIONS: EntryKind[] = ENTRY_KINDS as EntryKind[];

/** A segment as the edit form holds it, before validation. */
export type DraftEntry = {
  id: string;
  day: DayKey;
  start: string;
  end: string;
  kind: EntryKind;
  icon: string;
  title: string;
  note: string;
  tracked: boolean;
};

/**
 * Check one day's drafts with the same rules the build applies.
 *
 * `validateEntries` also reports overlaps across the entries it is given, so it
 * is called with the whole day: a new segment that collides with an existing one
 * is caught before it reaches the database.
 *
 * @param drafts Segments of one day, as the form holds them.
 * @returns One message per problem, empty when the day is valid.
 */
export function validateDrafts(drafts: DraftEntry[]): string[] {
  const result = validateEntries(drafts) as {errors: string[]};
  return result.errors;
}
