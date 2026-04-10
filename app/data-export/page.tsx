'use client';

import { useState, useCallback } from 'react';
import { getInfluencers } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Influencer } from '@/types';
import Footer from '@/components/Footer';

type ExportFormat = 'csv' | 'json';

function influencerToCsvRow(inf: Influencer): string {
  const escape = (val: string | number | undefined): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  return [
    escape(inf.id),
    escape(inf.handle),
    escape(inf.platform),
    escape(inf.full_name),
    escape(inf.bio),
    escape(inf.followers),
    escape(inf.following),
    escape(inf.avg_likes),
    escape(inf.avg_views),
    escape(inf.engagement_rate),
    escape(inf.profile_url),
    escape(inf.niche),
    escape(inf.status),
    escape(inf.notes),
    escape(inf.created_at),
  ].join(',');
}

const CSV_HEADER =
  'id,handle,platform,full_name,bio,followers,following,avg_likes,avg_views,engagement_rate,profile_url,niche,status,notes,created_at';

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DataExportPage() {
  const { isAuthenticated } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setError('');
      setSuccess('');
      setExporting(true);

      try {
        const influencers = await getInfluencers();
        const timestamp = new Date().toISOString().split('T')[0];

        if (format === 'json') {
          const data = JSON.stringify(influencers, null, 2);
          downloadBlob(data, `influencer-data-${timestamp}.json`, 'application/json');
        } else {
          const rows = [CSV_HEADER, ...influencers.map(influencerToCsvRow)];
          downloadBlob(rows.join('\n'), `influencer-data-${timestamp}.csv`, 'text/csv');
        }

        setSuccess(`Data exported successfully as ${format.toUpperCase()}.`);
      } catch {
        setError('Failed to export data. Please try again.');
      } finally {
        setExporting(false);
      }
    },
    []
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Please log in to export your data.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Your Data</h1>
        <p className="text-sm text-gray-500 mb-8">
          Download a copy of your influencer data in CSV or JSON format.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 mb-4">
            {success}
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Influencer Data</h2>
          <p className="text-sm text-gray-600">
            Export all your influencer records including profiles, metrics, outreach history,
            and notes. This supports your right to data portability under GDPR and CCPA.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {exporting ? 'Exporting…' : 'Download CSV'}
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {exporting ? 'Exporting…' : 'Download JSON'}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
