/**
 * Helpers for the GDPR / CCPA data-export endpoint.
 *
 * Both CSV and JSON downloads originate from the browser, so any field
 * that ultimately came from a user-controlled source (handle, full_name,
 * bio, niche, notes, response, …) has to be neutralized against
 * spreadsheet formula injection (CWE-1236) before it is written into a
 * CSV cell — a victim opening the export in Excel, Google Sheets, or
 * LibreOffice would otherwise see a leading `=`, `+`, `-`, `@`, tab
 * (`\t`), or carriage-return (`\r`) interpreted as a formula and could
 * be tricked into running `=HYPERLINK(...)`, `=WEBSERVICE(...)`, or DDE
 * commands that exfiltrate the row to an attacker-controlled URL.
 *
 * The mitigation has two parts:
 *
 *  1. **Prefix-neutralize formula leaders.** If, after coercing to a
 *     string, the field starts with one of `= + - @ \t \r`, we prepend
 *     a single apostrophe (`'`). Spreadsheet apps render the apostrophe
 *     as a "this cell is text" marker and do not display it, while
 *     plain-text consumers (jq, awk, manual reads) see the leading `'`.
 *
 *  2. **Quote every field unconditionally.** Quoting only on
 *     "looks-like-a-delimiter" was the pre-fix behaviour; that left a
 *     gap because an attacker can inject a leader hidden behind leading
 *     whitespace (` =1+1`) which trims-to-formula in some spreadsheets.
 *     Quoting every field also collapses the corner case of a literal
 *     `"` byte in the input.
 */

/** Characters that cause a spreadsheet to interpret the cell as a formula. */
const FORMULA_LEADERS = new Set(['=', '+', '-', '@', '\t', '\r']);

/**
 * Escape a single CSV field. Always returns a quoted value.
 *
 * Exported for unit tests; consumers should call {@link toCsvRow}.
 */
export function escapeCsvField(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  // Step 1: neutralize formula-injection leaders. We only inspect the
  // first character so legitimate values like "1+1" round-trip
  // unchanged. Empty strings are fine — `str[0]` is `undefined` and the
  // Set check is false.
  const neutralized = FORMULA_LEADERS.has(str[0])
    ? `'${str}`
    : str;
  // Step 2: escape embedded quotes per RFC 4180 and wrap in quotes.
  return `"${neutralized.replace(/"/g, '""')}"`;
}

/** Join an array of fields into a single CSV row, escaping each one. */
export function toCsvRow(fields: ReadonlyArray<string | number | boolean | null | undefined>): string {
  return fields.map(escapeCsvField).join(',');
}

/** Build a full CSV document from a header row + body rows. */
export function buildCsv(
  header: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<string | number | boolean | null | undefined>>,
): string {
  // RFC 4180 prescribes CRLF; we emit `\n` for parity with most modern
  // tooling, matching the previous implementation's behaviour.
  return [toCsvRow(header), ...rows.map(toCsvRow)].join('\n');
}
