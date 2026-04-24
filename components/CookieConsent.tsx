'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { recordCookieConsent } from '@/lib/api';

const COOKIE_CONSENT_KEY = 'cookie_consent';

export type ConsentValue = 'accepted' | 'rejected';

function getStoredConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (value === 'accepted' || value === 'rejected') return value;
    return null;
  } catch {
    return null;
  }
}

function storeConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    // Ignore storage errors
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- One-time post-hydration init from browser localStorage */
  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleAccept = useCallback(() => {
    storeConsent('accepted');
    setVisible(false);
    // (audit L-06) Mirror to the backend so the controller has an
    // authoritative consent log (GDPR Art. 7(1)). Best-effort — UI
    // state is the source of truth client-side.
    void recordCookieConsent({ consent: 'accepted' });
  }, []);

  const handleReject = useCallback(() => {
    storeConsent('rejected');
    setVisible(false);
    void recordCookieConsent({ consent: 'rejected' });
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-700 flex-1">
          We use essential cookies to operate this platform and optional cookies to improve your
          experience. See our{' '}
          <Link href="/cookie-policy" className="text-blue-600 hover:underline">
            Cookie Policy
          </Link>{' '}
          for details.
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Reject Non-Essential
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
