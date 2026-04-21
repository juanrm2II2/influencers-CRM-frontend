'use client';

import { useEffect, useState, useCallback } from 'react';
import { getInfluencers } from '@/lib/api';
import { Influencer, DashboardFilters } from '@/types';
import InfluencerCard from '@/components/InfluencerCard';
import StatsBar from '@/components/StatsBar';
import FilterBar from '@/components/FilterBar';
import AddInfluencerModal from '@/components/AddInfluencerModal';
import UserMenu from '@/components/UserMenu';
import Footer from '@/components/Footer';

export default function DashboardPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchInfluencers = useCallback(
    async (signal?: AbortSignal) => {
      // Defer state updates out of the synchronous effect execution
      // so they don't trigger cascading renders.
      await Promise.resolve();
      if (signal?.aborted) return;

      setLoading(true);
      setError('');

      try {
        const data = await getInfluencers(filters, { signal });
        if (!signal?.aborted) setInfluencers(data);
      } catch {
        if (!signal?.aborted) {
          setError('Failed to load influencers. Make sure the backend is running.');
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    const controller = new AbortController();

    return () => controller.abort();
  }, [fetchInfluencers, refreshKey]);

  const filteredInfluencers = filters.search
    ? influencers.filter(
        (inf) =>
          inf.full_name?.toLowerCase().includes(filters.search!.toLowerCase()) ||
          inf.handle?.toLowerCase().includes(filters.search!.toLowerCase())
      )
    : influencers;

  const stats = [
    { label: 'Total Influencers', value: filteredInfluencers.length },
    {
      label: 'Active Partnerships',
      value: filteredInfluencers.filter((i) => i.status === 'active').length,
    },
    {
      label: 'Avg Engagement Rate',
      value:
        filteredInfluencers.length > 0
          ? `${(
              filteredInfluencers.reduce((acc, i) => acc + Number(i.engagement_rate || 0), 0) /
              filteredInfluencers.length
            ).toFixed(2)}%`
          : '0%',
    },
    {
      label: 'Total Reach',
      value:
        filteredInfluencers.length > 0
          ? formatNumber(filteredInfluencers.reduce((acc, i) => acc + (i.followers || 0), 0))
          : '0',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Influencer CRM</h1>
            <p className="text-sm text-gray-500">Manage your influencer partnerships</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/token-sale"
              className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              Token Sale
            </a>
            <a
              href="/data-export"
              className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              Export Data
            </a>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              <span>Add Influencer</span>
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <StatsBar stats={stats} />

        <div className="flex items-center justify-between flex-wrap gap-4">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={() => setRefreshKey((k) => k + 1)}>Try again</button>
          </div>
        ) : filteredInfluencers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">No influencers found</p>
            <p className="text-gray-400 text-sm mb-6">
              Add your first influencer to get started.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Add Influencer
            </button>

            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredInfluencers.map((influencer) => (
              <InfluencerCard key={influencer.id} influencer={influencer} />
            ))}
          </div>
        )}
      </main>

      {showAddModal && (
        <AddInfluencerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(influencer) => {
            setInfluencers((prev) => [influencer, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
