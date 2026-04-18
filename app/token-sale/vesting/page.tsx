'use client';

import dynamic from 'next/dynamic';
import ConnectWallet from '@/components/web3/ConnectWallet';
import VestingScheduleComponent from '@/components/web3/VestingSchedule';
import UserMenu from '@/components/UserMenu';
import Footer from '@/components/Footer';

const Web3Provider = dynamic(() => import('@/components/web3/Web3Provider'), {
  ssr: false,
});

// app/token-sale/vesting/page.tsx

export const runtimeDynamic = 'force-dynamic';

// ... rest of the page component

export default function VestingPage() {
  return (
    <Web3Provider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Token Vesting</h1>
              <p className="text-sm text-gray-500">View your vesting schedule and claim tokens</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/token-sale"
                className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors"
              >
                ← Token Sale
              </a>
              <ConnectWallet />
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8 space-y-6 flex-1">
          <VestingScheduleComponent />
        </main>

        <Footer />
      </div>
    </Web3Provider>
  );
}
