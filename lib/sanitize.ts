import DOMPurify from 'dompurify';

/**
 * Minimal, dependency-free strip-tags fallback used when no DOM is
 * available (Server Components / Edge runtime / SSR). The output is the
 * textual content of the input with all tags, attributes, comments and
 * processing instructions removed so callers can never accidentally feed
 * unsanitized HTML into a non-JSX sink (CSV export, Content-Disposition,
 * `dangerouslySetInnerHTML` in a server component, etc.).
 *
 * This intentionally does NOT decode HTML entities: the input is treated
 * as text-with-markup, the markup is stripped, and the surviving text is
 * returned as-is so legitimate `&` / `<` characters round-trip when used
 * downstream as plain text.
 */
function stripTagsServer(input: string): string {
  return input
    // Remove HTML/XML comments (including conditional comments).
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove CDATA / processing instructions / doctype.
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<![A-Za-z][\s\S]*?>/g, '')
    // Remove <script>…</script> and <style>…</style> blocks entirely so
    // their textual contents do not leak into the output.
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
    // Strip any remaining tag (open, close, or self-closing).
    .replace(/<\/?[A-Za-z][^>]*>/g, '');
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
