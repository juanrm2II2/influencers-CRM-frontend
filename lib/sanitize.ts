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

  // RETURN_DOM gives us a DOM element directly; extracting textContent
  // strips all tags and decodes entities without using innerHTML.
  const clean = DOMPurify.sanitize(input, { RETURN_DOM: true });
  return clean.textContent ?? '';
}
