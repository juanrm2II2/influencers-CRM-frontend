'use client';

import { DashboardFilters } from '@/types';

const PLATFORMS = ['tiktok', 'instagram', 'youtube', 'twitter'];
const STATUSES = ['prospect', 'contacted', 'negotiating', 'active', 'declined'];
const NICHES = ['beauty', 'fashion', 'fitness', 'food', 'gaming', 'lifestyle', 'music', 'parenting', 'sports', 'tech', 'travel', 'other'];

interface Props {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

export default function FilterBar({ filters, onChange }: Props) {
  function update(key: keyof DashboardFilters, value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Search name or handle..."
        value={filters.search ?? ''}
        onChange={(e) => update('search', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
      />

      <select
        value={filters.platform ?? ''}
        onChange={(e) => update('platform', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Platforms</option>
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={filters.status ?? ''}
        onChange={(e) => update('status', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={filters.niche ?? ''}
        onChange={(e) => update('niche', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Niches</option>
        {NICHES.map((n) => (
          <option key={n} value={n}>
            {n.charAt(0).toUpperCase() + n.slice(1)}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Min Followers"
        value={filters.min_followers ?? ''}
        onChange={(e) => update('min_followers', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
        min={0}
      />
    </div>
  );
}
