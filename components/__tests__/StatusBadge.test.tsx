import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';
import type { Status } from '@/types';

describe('StatusBadge', () => {
  const statuses: { status: Status; label: string }[] = [
    { status: 'prospect', label: 'Prospect' },
    { status: 'contacted', label: 'Contacted' },
    { status: 'negotiating', label: 'Negotiating' },
    { status: 'active', label: 'Active' },
    { status: 'declined', label: 'Declined' },
  ];

  statuses.forEach(({ status, label }) => {
    it(`renders "${label}" for status "${status}"`, () => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('applies correct CSS classes for active status', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText('Active');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-700');
  });

  it('applies correct CSS classes for declined status', () => {
    render(<StatusBadge status="declined" />);
    const badge = screen.getByText('Declined');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-700');
  });

  it('falls back to prospect config for unknown status', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<StatusBadge status={'unknown' as any} />);
    expect(screen.getByText('Prospect')).toBeInTheDocument();
  });
});
