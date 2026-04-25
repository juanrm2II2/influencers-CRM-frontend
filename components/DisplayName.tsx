import { sanitizeText } from '@/lib/sanitize';

/**
 * Render a free-text identity field (name / handle / niche) sourced
 * from a third-party social-media scraper. Audit L-09: this is a
 * defense-in-depth wrapper. React's JSX escaping already prevents
 * direct DOM-XSS for these fields, but the codebase enforces the same
 * `sanitizeText` contract on `bio`, `notes`, `message_sent`, and
 * `response`. Centralising the wrapper here means future authors who
 * swap a `<p>{full_name}</p>` for `dangerouslySetInnerHTML` (or render
 * the value in a non-JSX sink such as CSV / Content-Disposition / a
 * future Server Component) cannot accidentally bypass sanitization.
 *
 * Empty / undefined values pass through as-is so callers can keep
 * using the natural `{a || b}` idiom (e.g.
 * `<DisplayName value={influencer.full_name || influencer.handle} />`).
 */
export interface DisplayNameProps {
  value: string | null | undefined;
  /** Optional prefix rendered verbatim (e.g. `@` for handles). */
  prefix?: string;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
  title?: string;
}

export default function DisplayName({
  value,
  prefix,
  className,
  as: Tag = 'span',
  title,
}: DisplayNameProps) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const safe = sanitizeText(value);
  return (
    <Tag className={className} title={title}>
      {prefix ? `${prefix}${safe}` : safe}
    </Tag>
  );
}
