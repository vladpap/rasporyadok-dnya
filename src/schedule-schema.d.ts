/**
 * Types for the shared schedule schema.
 *
 * `src/lib/schedule-schema.mjs` is written in plain JavaScript so the build
 * scripts and the browser can both use it without a build step. This declaration
 * describes the parts the app touches, so TypeScript understands the import while
 * the module stays the single definition of the rules.
 */

declare module '*/schedule-schema.mjs' {
  /** Activity kinds a segment may have. */
  export const ENTRY_KINDS: string[];

  /** Column names of the schedule CSV, in file order. */
  export const ENTRY_FIELDS: string[];

  /** Week days, with the key used in ids and the two labels shown. */
  export const DAY_DEFINITIONS: Array<{key: string; label: string; fullLabel: string}>;

  /** Convert `HH:MM` to minutes from midnight, or NaN when malformed. */
  export function timeToMinutes(time: string): number;

  /** Convert minutes from midnight back to `HH:MM`. */
  export function minutesToTime(minutes: number): string;

  /** Validate the rules that apply to a set of entries. */
  export function validateEntries(entries: unknown[]): {
    errors: string[];
    warnings: string[];
  };

  /** Validate a whole schedule, including that every day has entries. */
  export function validateSchedule(entries: unknown[]): {
    errors: string[];
    warnings: string[];
  };
}
