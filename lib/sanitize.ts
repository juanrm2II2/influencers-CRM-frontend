import DOMPurify from 'dompurify';

/**
 * Strip every HTML tag — including <script>/<style> blocks and the
 * textual content nested inside them — from a string. Used as the
 * SSR-side fallback for {@link sanitizeText} when no DOM is available
 * (Server Components / Edge runtime).
 *
 * Implemented as a single-pass character-by-character state machine
 * rather than a chain of regex replacements. This is deliberate:
 * regex-based strip-tags routinely fail on adversarial nested
 * constructs (e.g. `<<script>script>`, `<scr<script>ipt>`), and
 * CodeQL's `js/incomplete-multi-character-sanitization` /
 * `js/bad-tag-filter` rules flag exactly that anti-pattern. A linear
 * scan that tracks "are we inside a tag/script/style/comment?" is
 * idempotent by construction.
 */
function stripTagsServer(input: string): string {
  let out = '';
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];
    if (ch !== '<') {
      out += ch;
      i++;
      continue;
    }

    // Comment <!-- … -->
    if (input.startsWith('<!--', i)) {
      const end = input.indexOf('-->', i + 4);
      i = end === -1 ? len : end + 3;
      continue;
    }
    // CDATA <![CDATA[ … ]]>
    if (input.startsWith('<![CDATA[', i)) {
      const end = input.indexOf(']]>', i + 9);
      i = end === -1 ? len : end + 3;
      continue;
    }
    // Doctype / declaration <!FOO …>
    if (input[i + 1] === '!') {
      const end = input.indexOf('>', i + 2);
      i = end === -1 ? len : end + 1;
      continue;
    }
    // Processing instruction <? … ?>
    if (input[i + 1] === '?') {
      const end = input.indexOf('?>', i + 2);
      i = end === -1 ? len : end + 2;
      continue;
    }
    // <script …> … </script>  (drop both tags AND inner content).
    // Match by lower-casing only the literal byte we look at — no full
    // string alloc — and verify the next character is a tag terminator
    // (whitespace / `>` / `/`) so we do not match e.g. `<scripts>`.
    if (matchesTagOpen(input, i, 'script')) {
      i = skipUntilClosing(input, i, 'script');
      continue;
    }
    if (matchesTagOpen(input, i, 'style')) {
      i = skipUntilClosing(input, i, 'style');
      continue;
    }
    // Generic tag (open / close / self-closing). A `<` that is NOT
    // followed by a letter or `/` is treated as a literal byte —
    // matches HTML5 parser behaviour for stray `<`.
    const next = input[i + 1];
    if (next && (isAsciiLetter(next) || next === '/')) {
      const end = input.indexOf('>', i + 1);
      i = end === -1 ? len : end + 1;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function isAsciiLetter(c: string): boolean {
  const code = c.charCodeAt(0);
  return (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a);
}

/** Returns true when `input[i..]` starts with `<{tag}` followed by a
 *  tag-name terminator (`>`, `/`, whitespace). Case-insensitive. */
function matchesTagOpen(input: string, i: number, tag: string): boolean {
  if (input[i] !== '<') return false;
  const tagLen = tag.length;
  if (i + 1 + tagLen > input.length) return false;
  for (let k = 0; k < tagLen; k++) {
    const c = input.charCodeAt(i + 1 + k);
    const expected = tag.charCodeAt(k);
    // Compare lower-cased ASCII letters.
    if ((c | 0x20) !== expected) return false;
  }
  const after = input[i + 1 + tagLen];
  if (after === undefined) return false;
  return after === '>' || after === '/' || /\s/.test(after);
}

/** Skip from a `<{tag}…>` opener through its matching `</{tag}>`
 *  closer (or to EOF if unterminated). Case-insensitive. */
function skipUntilClosing(input: string, i: number, tag: string): number {
  // First, advance past the opening tag's `>`.
  const tagOpenEnd = input.indexOf('>', i);
  if (tagOpenEnd === -1) return input.length;
  let j = tagOpenEnd + 1;
  const closer = `</${tag}`;
  // Case-insensitive search for the closer.
  while (j < input.length) {
    const candidate = input.indexOf('<', j);
    if (candidate === -1) return input.length;
    if (matchesCloserAt(input, candidate, closer)) {
      const end = input.indexOf('>', candidate);
      return end === -1 ? input.length : end + 1;
    }
    j = candidate + 1;
  }
  return input.length;
}

function matchesCloserAt(input: string, i: number, closer: string): boolean {
  if (i + closer.length > input.length) return false;
  for (let k = 0; k < closer.length; k++) {
    const c = input.charCodeAt(i + k);
    const expected = closer.charCodeAt(k);
    if ((c | 0x20) !== (expected | 0x20)) return false;
  }
  const after = input[i + closer.length];
  return after === undefined || after === '>' || after === '/' || /\s/.test(after);
}

/**
 * Sanitize a plain-text string by stripping all HTML tags and attributes.
 * This is a defense-in-depth measure on top of React's built-in JSX escaping.
 * Used for user-generated content fields such as notes, messages, bios, and responses.
 *
 * Sanitization is enforced in *every* runtime — including the server /
 * Edge / RSC paths that have no DOM. The browser path uses DOMPurify; the
 * non-browser path falls back to {@link stripTagsServer}, an internal
 * dependency-free strip-tags routine. Previously the server branch was a
 * pass-through, which meant any future SSR sink that fed user-controlled
 * strings into a non-JSX context (CSV export, Content-Disposition,
 * `dangerouslySetInnerHTML` in a server component) could bypass
 * sanitization entirely (audit finding M-03).
 */
export function sanitizeText(input: string): string {
  if (!input) return '';

  // On the server (SSR / Edge / RSC) DOMPurify cannot run because there
  // is no DOM. Use the dependency-free strip-tags fallback so the
  // sanitization contract holds in every runtime.
  if (typeof window === 'undefined') {
    return stripTagsServer(input);
  }

  // RETURN_DOM gives us a DOM element directly; extracting textContent
  // strips all tags and decodes entities without using innerHTML.
  const clean = DOMPurify.sanitize(input, { RETURN_DOM: true });
  return clean.textContent ?? '';
}
