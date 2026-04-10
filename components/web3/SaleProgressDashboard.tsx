'use client';

import { useTokenSaleInfo, formatWei, formatTokenAmount } from '@/lib/web3/hooks';
import { useEffect, useState } from 'react';

function ProgressBar({ value, max, label }: { value: bigint; max: bigint; label: string }) {
  const pct = max > 0n ? Number((value * 10000n) / max) / 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}

function Countdown({ endTime }: { endTime: number }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function update() {
      const diff = endTime - Math.floor(Date.now() / 1000);
      if (diff <= 0) {
        setRemaining('Sale ended');
        return;
      }
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setRemaining(`${d}d ${h}h ${m}m ${s}s`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return <span>{remaining}</span>;
}

export default function SaleProgressDashboard() {
  const { saleInfo, isLoading, error } = useTokenSaleInfo();

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

  if (error || !saleInfo) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">Failed to load sale data</p>
      </div>
    );
  }

  const stats = [
    { label: 'Total Raised', value: `${formatWei(saleInfo.totalRaised)} ETH` },
    { label: 'Tokens Sold', value: formatTokenAmount(saleInfo.tokensSold) },
    { label: 'Token Price', value: `${formatWei(saleInfo.tokenPrice)} ETH` },
    {
      label: 'Time Remaining',
      value: <Countdown endTime={saleInfo.endTime} />,
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Sale Progress</h2>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            saleInfo.isPaused
              ? 'bg-yellow-100 text-yellow-800'
              : saleInfo.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              saleInfo.isPaused
                ? 'bg-yellow-500'
                : saleInfo.isActive
                  ? 'bg-green-500'
                  : 'bg-gray-500'
            }`}
          />
          {saleInfo.isPaused ? 'Paused' : saleInfo.isActive ? 'Live' : 'Ended'}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div className="space-y-4">
        <ProgressBar
          value={saleInfo.totalRaised}
          max={saleInfo.hardCap}
          label={`Hard cap: ${formatWei(saleInfo.hardCap)} ETH`}
        />
        <ProgressBar
          value={saleInfo.totalRaised}
          max={saleInfo.softCap}
          label={`Soft cap: ${formatWei(saleInfo.softCap)} ETH`}
        />
      </div>
    </div>
  );
}
