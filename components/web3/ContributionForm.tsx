'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useContribute, useKycVerification } from '@/lib/web3/hooks';

export default function ContributionForm() {
  const { address, isConnected } = useAccount();
  const { isVerified, verification, isLoading: kycLoading, fetchStatus } =
    useKycVerification(address);
  const { txState, contribute, reset } = useContribute();
  const [amount, setAmount] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');

  const handleReset = useCallback(() => {
    reset();
    setAmount('');
  }, [reset]);
  useEffect(() => {
    if (isConnected && address) {
      fetchStatus();
    }
  }, [isConnected, address, fetchStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Block contributions if KYC is not approved
    if (!isVerified) {
      setInputError('You must complete identity verification (KYC) before contributing.');
      return;
    }

    // Basic validation
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setInputError('Please enter a valid amount greater than 0.');
      return;
    }
    setInputError('');

    await contribute(amount);
  }

  const isProcessing =
    txState.status === 'pending' || txState.status === 'confirming';

  if (!isConnected) {
    return (
      <div>
        <p>Connect your wallet to contribute</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Contribute to Token Sale</h2>

      {/* KYC gate banner */}
      {!kycLoading && !isVerified && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4" role="alert">
          <p className="text-sm font-medium text-yellow-800">
            Identity verification required
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            {verification.status === 'pending'
              ? 'Your verification is under review. You will be able to contribute once approved.'
              : verification.status === 'rejected'
                ? 'Your verification was rejected. Please re-verify to contribute.'
                : 'You must complete KYC verification before making a contribution.'}
          </p>
        </div>
      )}

      <label htmlFor="amount" className="block">
        <span className="text-sm font-medium text-gray-700">Amount (ETH)</span>
      </label>

      <input
        id="amount"
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        aria-invalid={!!inputError}
        aria-describedby={inputError ? 'amount-error' : undefined}
        disabled={!isVerified}
      />

      {inputError && (
        <div id="amount-error" className="text-sm text-red-600">
          {inputError}
        </div>
      )}

      {txState.status === 'failed' && txState.error && (
        <div className="text-sm text-red-600">Error: {txState.error}</div>
      )}

      {txState.status === 'confirmed' && txState.hash && (
        <div className="text-sm text-green-600">
          Transaction confirmed: <span className="font-mono">{txState.hash}</span>
        </div>
      )}

      {txState.status === 'confirmed' && (
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Make another contribution
        </button>
      )}

      <button
        type="submit"
        disabled={isProcessing || !isVerified}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {txState.status === 'pending' ? 'Processing...' : 'Contribute'}
      </button>
    </form>
  );
}
