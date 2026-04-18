'use client';

export const dynamic = 'force-dynamic';
import dynamic from 'next/dynamic';
import ConnectWallet from '@/components/web3/ConnectWallet';
import SaleProgressDashboard from '@/components/web3/SaleProgressDashboard';
import ContributionForm from '@/components/web3/ContributionForm';
import KycVerificationBanner from '@/components/web3/KycVerificationBanner';
import UserMenu from '@/components/UserMenu';
import Footer from '@/components/Footer';

const Web3Provider = dynamic(() => import('@/components/web3/Web3Provider'), {
  ssr: false,
});

export default function TokenSalePage() {
  return (
    <Web3Provider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Token Sale</h1>
              <p className="text-sm text-gray-500">Contribute to the influencer token sale</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/dashboard"
                className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors"
              >
                ← Dashboard
              </a>
              <a
                href="/token-sale/vesting"
                className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors"
              >
                Vesting
              </a>
              <ConnectWallet />
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8 space-y-6 flex-1">
          <SaleProgressDashboard />
          <KycVerificationBanner />
          <ContributionForm />
        </main>

        <Footer />
      </div>
    </Web3Provider>
  );
}
