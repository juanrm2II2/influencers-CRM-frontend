import { describe, it, expect } from 'vitest';
import { escapeCsvField, toCsvRow, buildCsv } from '../export';

describe('escapeCsvField', () => {
  it('quotes a plain string', () => {
    expect(escapeCsvField('hello')).toBe('"hello"');
  });

  it('renders null and undefined as an empty quoted field', () => {
    expect(escapeCsvField(null)).toBe('""');
    expect(escapeCsvField(undefined)).toBe('""');
  });

  it('escapes embedded double quotes per RFC 4180', () => {
    expect(escapeCsvField('she said "hi"')).toBe('"she said ""hi"""');
  });

  it('preserves embedded commas and newlines without re-encoding', () => {
    expect(escapeCsvField('a,b\nc')).toBe('"a,b\nc"');
  });

  it('coerces numbers and booleans to strings', () => {
    expect(escapeCsvField(42)).toBe('"42"');
    expect(escapeCsvField(true)).toBe('"true"');
  });

  // ─── Formula-injection (CWE-1236, audit M-06) ─────────────────────────────

  it('neutralizes a leading = with an apostrophe', () => {
    expect(escapeCsvField('=1+1')).toBe(`"'=1+1"`);
  });

  it('neutralizes a leading + - @ tab and CR', () => {
    expect(escapeCsvField('+SUM(A1)')).toBe(`"'+SUM(A1)"`);
    expect(escapeCsvField('-2+3')).toBe(`"'-2+3"`);
    expect(escapeCsvField('@SUM(A1)')).toBe(`"'@SUM(A1)"`);
    expect(escapeCsvField('\t=1+1')).toBe(`"'\t=1+1"`);
    expect(escapeCsvField('\r=1+1')).toBe(`"'\r=1+1"`);
  });

  it('round-trips =1+1 to "\'=1+1"', () => {
    // Asserts the audit-mandated behaviour: =1+1 is preserved as text.
    const out = escapeCsvField('=1+1');
    // Strip outer quotes to inspect the cell value as a spreadsheet would.
    const inner = out.slice(1, -1);
    expect(inner).toBe(`'=1+1`);
  });

  it('preserves a non-leader character even if a formula op appears later', () => {
    // "1+1" must NOT be re-prefixed: the leader is `1`, not `+`.
    expect(escapeCsvField('1+1')).toBe('"1+1"');
  });

  it('neutralizes a bio of @SUM(A1)', () => {
    const out = escapeCsvField('@SUM(A1)');
    expect(out.slice(1, -1)).toBe(`'@SUM(A1)`);
  });
});

describe('toCsvRow', () => {
  it('joins escaped fields with a comma', () => {
    expect(toCsvRow(['a', 'b', 'c'])).toBe('"a","b","c"');
  });

  it('does not let an injected =FORMULA in any column escape the row', () => {
    expect(toCsvRow(['safe', '=cmd'])).toBe(`"safe","'=cmd"`);
  });
});

describe('buildCsv', () => {
  it('produces a header + body document', () => {
    const csv = buildCsv(['id', 'bio'], [
      ['1', 'hello'],
      ['2', '@SUM(A1)'],
    ]);
    expect(csv).toBe(`"id","bio"\n"1","hello"\n"2","'@SUM(A1)"`);
  });
});
