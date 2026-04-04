'use client';

import { useState } from 'react';
import { logOutreach } from '@/lib/api';
import { sanitizeText } from '@/lib/sanitize';
import { Channel, Outreach } from '@/types';

const CHANNELS: Channel[] = ['email', 'dm', 'telegram'];

interface Props {
  influencerId: string;
  onClose: () => void;
  onSuccess: (outreach: Outreach) => void;
}

export default function LogOutreachModal({ influencerId, onClose, onSuccess }: Props) {
  const [channel, setChannel] = useState<Channel>('dm');
  const [contactDate, setContactDate] = useState(new Date().toISOString().split('T')[0]);
  const [messageSent, setMessageSent] = useState('');
  const [response, setResponse] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!messageSent.trim()) return;
    setLoading(true);
    setError('');
    try {
      const outreach = await logOutreach(influencerId, {
        contact_date: contactDate,
        channel,
        message_sent: sanitizeText(messageSent),
        response: response ? sanitizeText(response) : undefined,
        follow_up_date: followUpDate || undefined,
      });
      onSuccess(outreach);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to log outreach. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Log Outreach</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as Channel)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Date</label>
              <input
                type="date"
                value={contactDate}
                onChange={(e) => setContactDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Sent</label>
            <textarea
              value={messageSent}
              onChange={(e) => setMessageSent(e.target.value)}
              placeholder="Write the message you sent..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Response <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Their response..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Follow-up Date <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {loading ? 'Saving...' : 'Log Outreach'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
