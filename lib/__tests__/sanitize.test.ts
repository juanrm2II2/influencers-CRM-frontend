import { describe, it, expect, afterEach } from 'vitest';
import { sanitizeText } from '../sanitize';

describe('sanitizeText', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(sanitizeText('Hello world')).toBe('Hello world');
  });

  it('strips HTML script tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('');
  });

  it('strips HTML tags but keeps text content', () => {
    expect(sanitizeText('<b>bold</b> and <i>italic</i>')).toBe('bold and italic');
  });

  it('strips event handler attributes', () => {
    expect(sanitizeText('<div onmouseover="alert(1)">hover</div>')).toBe('hover');
  });

  it('strips img tags with onerror', () => {
    expect(sanitizeText('<img src=x onerror="alert(1)">')).toBe('');
  });

  it('handles nested malicious HTML', () => {
    expect(sanitizeText('<div><script>alert(1)</script>safe text</div>')).toBe('safe text');
  });

  it('preserves special characters that are not HTML', () => {
    expect(sanitizeText('Price: $100 & 50% off < $200')).toBe('Price: $100 & 50% off < $200');
  });

  it('handles multiline content', () => {
    const input = 'Line 1\nLine 2\nLine 3';
    expect(sanitizeText(input)).toBe('Line 1\nLine 2\nLine 3');
  });

  it('strips anchor tags but keeps text', () => {
    expect(sanitizeText('<a href="javascript:alert(1)">click me</a>')).toBe('click me');
  });

  it('strips style tags', () => {
    expect(sanitizeText('<style>body{display:none}</style>visible')).toBe('visible');
  });

  it('strips iframe tags', () => {
    expect(sanitizeText('<iframe src="evil.com"></iframe>safe')).toBe('safe');
  });
});

describe('sanitizeText (SSR fallback)', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    // Restore window after each test
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  });

  it('strips HTML tags via the dependency-free fallback when window is undefined (SSR)', () => {
    // Simulate SSR by removing window
    const saved = globalThis.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = undefined;

    // Plain text round-trips unchanged.
    expect(sanitizeText('plain text')).toBe('plain text');
    // <script> blocks and their contents are stripped, not passed through.
    expect(sanitizeText('<script>alert(1)</script>')).toBe('');
    expect(sanitizeText('<b>bold</b> text')).toBe('bold text');
    expect(sanitizeText('<div onmouseover="x">hi</div>')).toBe('hi');
    expect(sanitizeText('<img src=x onerror="alert(1)">safe')).toBe('safe');
    expect(sanitizeText('<style>body{}</style>visible')).toBe('visible');
    expect(sanitizeText('<!-- comment -->kept')).toBe('kept');

    // Adversarial: nested constructs that defeat single-pass regex
    // strippers. The state-machine implementation is idempotent.
    // `<<script>...>` — the first `<` is a stray (next char is `<`, not
    // a letter or `/`) so it is preserved as a literal byte; the inner
    // `<script>...</script>` is then stripped, leaving `<>`.
    expect(sanitizeText('<<script>alert(1)</script>>')).toBe('<>');
    expect(sanitizeText('<scr<script>ipt>alert(1)</script>')).toBe('ipt>alert(1)');
    expect(sanitizeText('<SCRIPT>x</SCRIPT>kept')).toBe('kept');
    expect(sanitizeText('<script\nfoo>x</script\t>kept')).toBe('kept');
    expect(sanitizeText('a < b')).toBe('a < b'); // stray `<` preserved
    expect(sanitizeText('unterminated <b')).toBe('unterminated ');

    // Restore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = saved;
  });

  it('returns empty string for empty input in SSR', () => {
    const saved = globalThis.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = undefined;

    expect(sanitizeText('')).toBe('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = saved;
  });
});
