/**
 * Minimal RFC 4180 style CSV reader and writer.
 *
 * The schedule source file is edited by hand, so the reader tolerates the small
 * variations such files contain: CRLF line endings, quoted fields that hold
 * commas, doubled quotes inside quoted fields, and a trailing newline.
 *
 * Fields are read and written as strings. Converting them to numbers or
 * booleans is the job of the schedule schema module.
 */

/** Characters that force a field to be quoted when writing. */
const QUOTING_TRIGGER = /[",\r\n]/;

/**
 * Parse CSV text into rows of string fields.
 *
 * Empty lines are dropped. Unquoted fields are trimmed, quoted fields keep
 * their content exactly as written.
 *
 * @param {string} text Raw file content.
 * @returns {string[][]} Rows of fields, one array per line.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let insideQuotes = false;
  let fieldWasQuoted = false;
  let quoteClosed = false;

  const finishField = () => {
    row.push(fieldWasQuoted ? field : field.trim());
    field = '';
    fieldWasQuoted = false;
    quoteClosed = false;
  };

  const finishRow = () => {
    finishField();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    // Spaces between a closing quote and the delimiter are layout, not content.
    if (quoteClosed && (character === ' ' || character === '\t')) {
      continue;
    }
    quoteClosed = false;

    if (insideQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          insideQuotes = false;
          quoteClosed = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.trim() === '') {
      insideQuotes = true;
      fieldWasQuoted = true;
      field = '';
      continue;
    }

    if (character === ',') {
      finishField();
      continue;
    }

    if (character === '\r') {
      continue;
    }

    if (character === '\n') {
      finishRow();
      continue;
    }

    field += character;
  }

  if (field !== '' || row.length > 0 || fieldWasQuoted) {
    finishRow();
  }

  return rows.filter((fields) => fields.some((value) => value !== ''));
}

/**
 * Format one row of fields as a CSV line.
 *
 * @param {readonly (string | number | boolean)[]} fields Field values.
 * @returns {string} Line without a trailing newline.
 */
export function formatCsvRow(fields) {
  return fields
    .map((field) => {
      const value = String(field ?? '');
      const needsQuotes = QUOTING_TRIGGER.test(value);
      return needsQuotes ? `"${value.replaceAll('"', '""')}"` : value;
    })
    .join(',');
}

/**
 * Format rows of fields as a complete CSV document.
 *
 * @param {readonly (readonly (string | number | boolean)[])[]} rows Rows.
 * @returns {string} Document text ending with a newline.
 */
export function formatCsv(rows) {
  return `${rows.map(formatCsvRow).join('\n')}\n`;
}
