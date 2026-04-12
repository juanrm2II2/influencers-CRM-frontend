'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useKycVerification } from '@/lib/web3/hooks';
import type { KycStatus } from '@/types/web3';

const STATUS_CONFIG: Record<KycStatus, { label: string; color: string; bg: string; border: string }> = {
  none: {
    label: 'Not Started',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
  },
  pending: {
    label: 'Under Review',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
  approved: {
    label: 'Verified',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  expired: {
    label: 'Expired',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
};

export default function KycVerificationBanner() {
  const { address, isConnected } = useAccount();
  const { verification, isVerified, isLoading, error, fetchStatus, requestToken } =
    useKycVerification(address);

  useEffect(() => {
    if (isConnected && address) {
      fetchStatus();
    }
  }, [isConnected, address, fetchStatus]);

  if (!isConnected) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse" role="status">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <span className="sr-only">Loading KYC status…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6" role="alert">
        <p className="text-red-700 font-medium">Unable to load KYC status</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchStatus}
          className="mt-3 text-sm text-red-700 underline hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const config = STATUS_CONFIG[verification.status];

  async function handleStartVerification() {
    try {
      const { token } = await requestToken();
      // The SumSub WebSDK is loaded via a dynamic import to avoid bundling
      // it unless needed. The SDK renders its own iframe-based UI.
      // In production, this would initialise the SumSub WebSDK:
      //   const snsWebSdk = (await import('@sumsub/websdk')).default;
      //   snsWebSdk.init(token, ...).launch('#kyc-container');
      //
      // For now we dispatch a custom event so the application can hook into
      // the flow, and log the token presence for debugging.
      window.dispatchEvent(
        new CustomEvent('kyc:launch', { detail: { token } }),
      );
    } catch {
      // Error is handled within the hook / will surface on next fetchStatus
    }
  }

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Identity Verification (KYC)</h3>
          <p className={`text-sm mt-1 ${config.color}`}>
            Status: <span data-testid="kyc-status">{config.label}</span>
          </p>
          {verification.status === 'rejected' && verification.rejectionReason && (
            <p className="text-xs text-red-600 mt-1">Reason: {verification.rejectionReason}</p>
          )}
          {verification.status === 'approved' && verification.expiresAt && (
            <p className="text-xs text-green-600 mt-1">
              Valid until {new Date(verification.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {!isVerified && verification.status !== 'pending' && (
          <button
            onClick={handleStartVerification}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {verification.status === 'none' ? 'Start Verification' : 'Re-verify'}
          </button>
        )}

        {verification.status === 'pending' && (
          <span className="inline-flex items-center gap-1 text-sm text-yellow-700">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Verification in progress…
          </span>
        )}
      </div>

      {/* Container for SumSub WebSDK iframe (mounted programmatically) */}
      <div id="kyc-container" />
    </div>
  );
}
