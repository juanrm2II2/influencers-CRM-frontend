'use client';

import type { TransactionState } from '@/types/web3';

interface TransactionReceiptProps {
  txState: TransactionState;
  onReset: () => void;
}

function explorerUrl(hash: `0x${string}`): string {
  // Default to etherscan; in production this should be chain-aware
  return `https://etherscan.io/tx/${hash}`;
}

export default function TransactionReceipt({ txState, onReset }: TransactionReceiptProps) {
  if (txState.status === 'idle') return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Transaction Status</h3>

      {/* Status indicator */}
      <div className="flex items-center gap-3">
        {txState.status === 'pending' && (
          <>
            <svg
              className="animate-spin h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-gray-700">Waiting for wallet confirmation…</p>
          </>
        )}

        {txState.status === 'confirming' && (
          <>
            <svg
              className="animate-spin h-6 w-6 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <div>
              <p className="text-gray-700">Transaction submitted, waiting for confirmation…</p>
              {txState.hash && (
                <a
                  href={explorerUrl(txState.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View on explorer ↗
                </a>
              )}
            </div>
          </>
        )}

        {txState.status === 'confirmed' && (
          <>
            <span className="text-green-600 text-2xl" aria-hidden="true">✓</span>
            <div>
              <p className="text-green-700 font-medium">Transaction confirmed!</p>
              {txState.receipt && (
                <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                  <p>Block: {txState.receipt.blockNumber.toString()}</p>
                  <p>Gas used: {txState.receipt.gasUsed.toString()}</p>
                  <a
                    href={explorerUrl(txState.receipt.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View on explorer ↗
                  </a>
                </div>
              )}
            </div>
          </>
        )}

        {txState.status === 'failed' && (
          <>
            <span className="text-red-600 text-2xl" aria-hidden="true">✕</span>
            <div>
              <p className="text-red-700 font-medium">Transaction failed</p>
              {txState.error && (
                <p className="text-sm text-red-500 mt-1">{txState.error}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Action button */}
      {(txState.status === 'confirmed' || txState.status === 'failed') && (
        <button
          onClick={onReset}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {txState.status === 'confirmed' ? 'Make another contribution' : 'Try again'}
        </button>
      )}
    </div>
  );
}
