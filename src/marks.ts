/**
 * Storage for the marks that say which segments are done.
 *
 * Marks are kept per calendar day, so history accumulates and the week view can
 * show any day. The store is described by an interface rather than used
 * directly, because the marks are meant to move to Supabase: a database-backed
 * store implements the same three methods and the views stay unchanged.
 */

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
 * This is the single place that decides where marks live, which is how the
 * move to Supabase stays contained: a database-backed store implements
 * `MarkStore` and is returned from here instead.
 *
 * @returns The active mark store.
 */
export function createMarkStore(): MarkStore {
  return createLocalMarkStore();
}

/**
 * Create the browser-local mark store used until the Supabase store replaces it.
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
