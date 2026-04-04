import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from '../FilterBar';
import type { DashboardFilters } from '@/types';

describe('FilterBar', () => {
  const defaultFilters: DashboardFilters = {};
  const mockOnChange = vi.fn();

  it('renders all filter inputs', () => {
    render(<FilterBar filters={defaultFilters} onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText('Search name or handle...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Platforms')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Niches')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min Followers')).toBeInTheDocument();
  });

  it('calls onChange when search input changes', async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={defaultFilters} onChange={mockOnChange} />);

    const searchInput = screen.getByPlaceholderText('Search name or handle...');
    await user.type(searchInput, 'a');

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'a' }));
  });

  it('calls onChange when platform select changes', async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={defaultFilters} onChange={mockOnChange} />);

    const platformSelect = screen.getByDisplayValue('All Platforms');
    await user.selectOptions(platformSelect, 'instagram');

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ platform: 'instagram' }));
  });

  it('calls onChange when status select changes', async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={defaultFilters} onChange={mockOnChange} />);

    const statusSelect = screen.getByDisplayValue('All Statuses');
    await user.selectOptions(statusSelect, 'active');

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('calls onChange when niche select changes', async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={defaultFilters} onChange={mockOnChange} />);

    const nicheSelect = screen.getByDisplayValue('All Niches');
    await user.selectOptions(nicheSelect, 'tech');

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ niche: 'tech' }));
  });

  it('clears filter when empty option is selected', async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={{ platform: 'instagram' }} onChange={mockOnChange} />);

    const platformSelect = screen.getByDisplayValue('Instagram');
    await user.selectOptions(platformSelect, '');

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ platform: undefined }),
    );
  });

  it('displays current filter values', () => {
    const filters: DashboardFilters = {
      search: 'test',
      platform: 'youtube',
      status: 'negotiating',
      niche: 'fitness',
      min_followers: '5000',
    };

    render(<FilterBar filters={filters} onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
    // Select values match the option value attributes, not displayed text
    const platformSelect = screen.getAllByRole('combobox')[0];
    expect((platformSelect as HTMLSelectElement).value).toBe('youtube');
    const statusSelect = screen.getAllByRole('combobox')[1];
    expect((statusSelect as HTMLSelectElement).value).toBe('negotiating');
    const nicheSelect = screen.getAllByRole('combobox')[2];
    expect((nicheSelect as HTMLSelectElement).value).toBe('fitness');
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
  });
});
