'use client';

import { useAccount } from 'wagmi';
import {
  useVestingSchedule,
  useReleasableAmount,
  useClaimVestedTokens,
  formatTokenAmount,
} from '@/lib/web3/hooks';
import TransactionReceipt from './TransactionReceipt';

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  if (days >= 365) {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    return remainingDays > 0 ? `${years}y ${remainingDays}d` : `${years}y`;
  }
  if (days > 0) return `${days}d`;
  const hours = Math.floor(seconds / 3600);
  return `${hours}h`;
}

export default function VestingSchedule() {
  const { address, isConnected } = useAccount();
  const { schedule, isLoading, error } = useVestingSchedule(address);
  const { releasable, isLoading: releasableLoading } = useReleasableAmount(address);
  const { txState, claim, reset } = useClaimVestedTokens();

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-500">Connect your wallet to view your vesting schedule</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-500">No vesting schedule found for your wallet</p>
      </div>
    );
  }

  if (txState.status !== 'idle') {
    return <TransactionReceipt txState={txState} onReset={reset} />;
  }

  const now = Math.floor(Date.now() / 1000);
  const cliffEnd = schedule.startTime + schedule.cliffDuration;
  const vestingEnd = schedule.startTime + schedule.vestingDuration;
  const isCliffPassed = now >= cliffEnd;
  const vestedPct =
    schedule.totalAmount > 0n
      ? Number((schedule.releasedAmount * 10000n) / schedule.totalAmount) / 100
      : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Vesting Schedule</h2>
        {schedule.revoked && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            Revoked
          </span>
        )}
      </div>

      {/* Schedule details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Total allocation</span>
          <p className="font-medium">{formatTokenAmount(schedule.totalAmount)} tokens</p>
        </div>
        <div>
          <span className="text-gray-500">Released</span>
          <p className="font-medium">{formatTokenAmount(schedule.releasedAmount)} tokens</p>
        </div>
        <div>
          <span className="text-gray-500">Available to claim</span>
          <p className="font-medium text-green-600">
            {releasableLoading ? '…' : `${formatTokenAmount(releasable)} tokens`}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Start date</span>
          <p className="font-medium">{formatDate(schedule.startTime)}</p>
        </div>
        <div>
          <span className="text-gray-500">Cliff</span>
          <p className="font-medium">
            {formatDuration(schedule.cliffDuration)}{' '}
            <span className={isCliffPassed ? 'text-green-600' : 'text-yellow-600'}>
              ({isCliffPassed ? 'passed' : 'pending'})
            </span>
          </p>
        </div>
        <div>
          <span className="text-gray-500">End date</span>
          <p className="font-medium">{formatDate(vestingEnd)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Vested</span>
          <span className="font-medium">{vestedPct.toFixed(1)}%</span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-600 transition-all duration-700"
            style={{ width: `${Math.min(vestedPct, 100)}%` }}
            role="progressbar"
            aria-valuenow={vestedPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Vesting progress"
          />
        </div>
      </div>

      {/* Claim button */}
      <button
        onClick={claim}
        disabled={!isCliffPassed || releasable === 0n || schedule.revoked}
        className="w-full rounded-lg bg-green-600 px-4 py-3 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isCliffPassed
          ? `Cliff ends ${formatDate(cliffEnd)}`
          : releasable === 0n
            ? 'Nothing to claim'
            : `Claim ${formatTokenAmount(releasable)} tokens`}
      </button>
    </div>
  );
}
