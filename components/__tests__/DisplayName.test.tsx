import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DisplayName from '../DisplayName';

describe('DisplayName (audit L-09)', () => {
  it('strips HTML tags from the rendered value', () => {
    render(<DisplayName value="<img src=x onerror=alert(1)>Alice" />);
    // After sanitization the tag is stripped; the remaining text is
    // rendered as plain text by React.
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('strips a payload typical of stored-XSS attempts', () => {
    render(<DisplayName value="<script>alert(1)</script>Bob" />);
    // <script> contents are dropped entirely by sanitizeText.
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain('alert');
  });

  it('renders prefix verbatim alongside sanitised value', () => {
    render(<DisplayName value="<b>hax</b>or" prefix="@" />);
    expect(screen.getByText('@haxor')).toBeInTheDocument();
  });

  it('returns null for empty / nullish values', () => {
    const { container: a } = render(<DisplayName value={null} />);
    const { container: b } = render(<DisplayName value={undefined} />);
    const { container: c } = render(<DisplayName value="" />);
    expect(a.firstChild).toBeNull();
    expect(b.firstChild).toBeNull();
    expect(c.firstChild).toBeNull();
  });

  it('renders as the requested element', () => {
    render(<DisplayName as="h1" value="Alice" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Alice' })).toBeInTheDocument();
  });

  it('passes through plain text unchanged', () => {
    render(<DisplayName value="@handle_with-dots.99" />);
    expect(screen.getByText('@handle_with-dots.99')).toBeInTheDocument();
  });
});
