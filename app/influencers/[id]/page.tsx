'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getInfluencer, updateInfluencer, deleteInfluencer } from '@/lib/api';
import { Influencer, Outreach, Status } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import PlatformIcon from '@/components/PlatformIcon';
import LogOutreachModal from '@/components/LogOutreachModal';
import UserMenu from '@/components/UserMenu';

const STATUSES: Status[] = ['prospect', 'contacted', 'negotiating', 'active', 'declined'];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const CHANNEL_ICONS: Record<string, string> = {
  email: '✉️',
  dm: '💬',
  telegram: '📱',
};

export default function InfluencerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchInfluencer = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getInfluencer(id);
      setInfluencer(data);
      setNotes(data.notes || '');
    } catch {
      setError('Failed to load influencer.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchInfluencer();
  }, [id, fetchInfluencer]);

  async function handleStatusChange(newStatus: Status) {
    if (!influencer) return;
    try {
      const updated = await updateInfluencer(id, { status: newStatus });
      setInfluencer((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch {
      // silently fail status update
    }
  }

  async function handleNotesSave() {
    if (!influencer || notes === influencer.notes) return;
    setSavingNotes(true);
    try {
      await updateInfluencer(id, { notes });
      setInfluencer((prev) => (prev ? { ...prev, notes } : prev));
    } catch {
      // silently fail notes save
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this influencer?')) return;
    setDeleting(true);
    try {
      await deleteInfluencer(id);
      router.push('/dashboard');
    } catch {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Influencer not found'}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const outreachList: Outreach[] = influencer.outreach || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
            ← Dashboard
          </Link>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {influencer.profile_pic_url ? (
                <Image
                  src={influencer.profile_pic_url}
                  alt={influencer.full_name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                  {influencer.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {influencer.full_name || influencer.handle}
                </h1>
                <PlatformIcon platform={influencer.platform} showLabel />
                <StatusBadge status={influencer.status} />
              </div>
              <p className="text-gray-500 mt-1">@{influencer.handle}</p>
              {influencer.profile_url && (
                <a
                  href={influencer.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                >
                  View Profile ↗
                </a>
              )}
              {influencer.bio && (
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">{influencer.bio}</p>
              )}
              {influencer.niche && (
                <span className="inline-block mt-3 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {influencer.niche}
                </span>
              )}
            </div>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-50 flex-shrink-0"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          {/* Followers row */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-100 pt-5">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{formatNumber(influencer.followers)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{formatNumber(influencer.following)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Following</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{formatNumber(influencer.avg_likes)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Avg Likes</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{formatNumber(influencer.avg_views)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Avg Views</p>
            </div>
          </div>

          {/* Engagement Rate */}
          <div className="mt-4 bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">Engagement Rate</span>
            <span className="text-lg font-bold text-blue-900">
              {influencer.engagement_rate != null
                ? `${Number(influencer.engagement_rate).toFixed(2)}%`
                : '—'}
            </span>
          </div>
        </div>

        {/* Status + Notes */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={influencer.status}
              onChange={(e) => handleStatusChange(e.target.value as Status)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
              {savingNotes && (
                <span className="ml-2 text-xs font-normal text-gray-400">Saving...</span>
              )}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesSave}
              placeholder="Add notes about this influencer..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Outreach Timeline */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Outreach History</h2>
            <button
              onClick={() => setShowOutreachModal(true)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Log Outreach
            </button>
          </div>

          {outreachList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No outreach logged yet. Click &ldquo;Log Outreach&rdquo; to add one.
            </p>
          ) : (
            <div className="space-y-4">
              {outreachList
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime()
                )
                .map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{CHANNEL_ICONS[item.channel] ?? '📝'}</span>
                      <span className="text-sm font-semibold text-gray-700 capitalize">
                        {item.channel}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{formatDate(item.contact_date)}</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                          Message Sent
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">{item.message_sent}</p>
                      </div>
                      {item.response && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                            Response
                          </p>
                          <p className="text-sm text-gray-700 mt-0.5">{item.response}</p>
                        </div>
                      )}
                      {item.follow_up_date && (
                        <p className="text-xs text-gray-400">
                          Follow-up: {formatDate(item.follow_up_date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      {showOutreachModal && (
        <LogOutreachModal
          influencerId={id}
          onClose={() => setShowOutreachModal(false)}
          onSuccess={(outreach) => {
            setInfluencer((prev) =>
              prev ? { ...prev, outreach: [outreach, ...(prev.outreach || [])] } : prev
            );
            setShowOutreachModal(false);
          }}
        />
      )}
    </div>
  );
}
