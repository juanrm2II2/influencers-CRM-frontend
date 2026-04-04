import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsBar from '../StatsBar';

describe('StatsBar', () => {
  it('renders all stat items', () => {
    const stats = [
      { label: 'Total', value: 42 },
      { label: 'Active', value: 10 },
      { label: 'Rate', value: '5.5%' },
      { label: 'Reach', value: '100K' },
    ];

    render(<StatsBar stats={stats} />);

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Rate')).toBeInTheDocument();
    expect(screen.getByText('5.5%')).toBeInTheDocument();
    expect(screen.getByText('Reach')).toBeInTheDocument();
    expect(screen.getByText('100K')).toBeInTheDocument();
  });

  it('renders empty when no stats', () => {
    const { container } = render(<StatsBar stats={[]} />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.children.length).toBe(0);
  });

  it('renders string and number values correctly', () => {
    const stats = [
      { label: 'Count', value: 0 },
      { label: 'Label', value: 'N/A' },
    ];

    render(<StatsBar stats={stats} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
