import DOMPurify from 'dompurify';

/**
 * Sanitize a plain-text string by stripping all HTML tags and attributes.
 * This is a defense-in-depth measure on top of React's built-in JSX escaping.
 * Used for user-generated content fields such as notes, messages, bios, and responses.
 */
export function sanitizeText(input: string): string {
  if (!input) return '';

  // On the server (SSR), DOMPurify requires a DOM; skip and rely on React escaping.
  if (typeof window === 'undefined') return input;

  // DOMPurify.sanitize returns HTML-safe output (entities encoded).
  // Since we render in React JSX text nodes (which escape again), decode entities
  // to avoid double-encoding (e.g. "&amp;amp;").
  const sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  const el = document.createElement('span');
  el.innerHTML = sanitized;
  return el.textContent ?? '';
}
