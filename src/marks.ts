/**
 * Storage for the marks that say which segments are done.
 *
 * Marks are kept per calendar day, so history accumulates and the week view can
 * show any day. They live in the `marks` table of Supabase, which makes them
 * available on every device; the local storage store is kept as a fallback for
 * development and for the smoke test, which runs without a network.
 */

import {supabase} from './supabase';

/** Storage contract for done marks. */
export type MarkStore = {
  /** Read the identifiers marked as done on one day. */
  load(dayKey: string): Promise<string[]>;
  /** Replace the identifiers marked as done on one day. */
  save(dayKey: string, doneIds: string[]): Promise<void>;
};

/** Shape written to local storage. */
type StoredMarks = {
  version: number;
  days: Record<string, string[]>;
};

const STORAGE_KEY = 'rasporyadok-dnya.marks';

/**
 * Marker so the stored shape can change later without misreading old data.
 */
const STORAGE_VERSION = 1;

/**
 * Read the whole marks document from local storage.
 *
 * @returns Stored marks, or an empty document when nothing is stored yet or the
 *   stored value cannot be parsed.
 */
function readDocument(): StoredMarks {
  const empty: StoredMarks = {version: STORAGE_VERSION, days: {}};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return empty;
  }

  try {
    const parsed = JSON.parse(raw) as StoredMarks;
    if (parsed.version !== STORAGE_VERSION || typeof parsed.days !== 'object') {
      return empty;
    }
    return parsed;
  } catch {
    return empty;
  }
}

/**
 * Write the whole marks document to local storage.
 *
 * @param document Marks to persist.
 */
function writeDocument(document: StoredMarks): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
}

/**
 * Create the mark store the app uses.
 *
 * This is the single place that decides where marks live, so switching storage
 * touches nothing else. The smoke test sets `window.__rasporyadokUseLocalMarks`
 * to keep its run offline and deterministic.
 *
 * @returns The active mark store.
 */
export function createMarkStore(): MarkStore {
  const useLocal = Boolean(
    (window as unknown as {__rasporyadokUseLocalMarks?: boolean}).__rasporyadokUseLocalMarks,
  );
  return useLocal ? createLocalMarkStore() : createSupabaseMarkStore();
}

/**
 * Create the Supabase-backed mark store.
 *
 * The table has one row per marked segment of a day, so loading a day is one
 * filtered read and saving is a delete-and-insert of that day's rows. The delete
 * is scoped to the day, so another day is never touched.
 *
 * @returns A store that keeps marks in the `marks` table.
 */
export function createSupabaseMarkStore(): MarkStore {
  return {
    async load(dayKey: string): Promise<string[]> {
      const {data, error} = await supabase
        .from('marks')
        .select('entry_id')
        .eq('day_key', dayKey);

      if (error) {
        throw new Error(`Не удалось загрузить отметки: ${error.message}`);
      }

      return (data ?? []).map((row) => (row as {entry_id: string}).entry_id);
    },
    async save(dayKey: string, doneIds: string[]): Promise<void> {
      const {error: deleteError} = await supabase.from('marks').delete().eq('day_key', dayKey);
      if (deleteError) {
        throw new Error(`Не удалось сохранить отметки: ${deleteError.message}`);
      }

      if (doneIds.length === 0) {
        return;
      }

      const {error: insertError} = await supabase
        .from('marks')
        .insert(doneIds.map((entryId) => ({day_key: dayKey, entry_id: entryId})));
      if (insertError) {
        throw new Error(`Не удалось сохранить отметки: ${insertError.message}`);
      }
    },
  };
}

/**
 * Create the browser-local mark store, used by the smoke test and as a fallback.
 *
 * Marks stay on one device and one browser; clearing site data removes them.
 *
 * @returns A store that keeps marks in local storage.
 */
export function createLocalMarkStore(): MarkStore {
  return {
    async load(dayKey: string): Promise<string[]> {
      return readDocument().days[dayKey] ?? [];
    },
    async save(dayKey: string, doneIds: string[]): Promise<void> {
      const document = readDocument();
      document.days[dayKey] = doneIds;
      writeDocument(document);
    },
  };
}
