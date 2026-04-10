'use client';

import { useState, type FormEvent } from 'react';
import { useAccount } from 'wagmi';
import { useContribute, useTokenSaleInfo, useWhitelistStatus, useUserContribution, formatWei } from '@/lib/web3/hooks';
import TransactionReceipt from './TransactionReceipt';

export default function ContributionForm() {
  const { address, isConnected } = useAccount();
  const { saleInfo } = useTokenSaleInfo();
  const { isWhitelisted, maxContribution } = useWhitelistStatus(address);
  const { contribution } = useUserContribution(address);
  const { txState, contribute, reset } = useContribute();

  const [amount, setAmount] = useState('');
  const [inputError, setInputError] = useState('');

  function validate(value: string): string {
    if (!value || Number(value) <= 0) return 'Enter a positive amount';
    if (Number.isNaN(Number(value))) return 'Invalid number';
    if (saleInfo && !saleInfo.isActive) return 'Sale is not active';
    if (saleInfo?.isPaused) return 'Sale is paused';
    if (!isWhitelisted) return 'Your wallet is not whitelisted';
    return '';
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate(amount);
    if (err) {
      setInputError(err);
      return;
    }
    setInputError('');
    contribute(amount);
  }

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-500">Connect your wallet to contribute</p>
      </div>
    );
  }

  if (txState.status !== 'idle') {
    return <TransactionReceipt txState={txState} onReset={reset} />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 space-y-5"
    >
      <h2 className="text-lg font-semibold text-gray-900">Contribute to Token Sale</h2>

      {/* Whitelist & current contribution info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Whitelist status</span>
          <p className={isWhitelisted ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {isWhitelisted ? 'Approved' : 'Not whitelisted'}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Max allocation</span>
          <p className="font-medium">{formatWei(maxContribution)} ETH</p>
        </div>
        <div>
          <span className="text-gray-500">Your contribution</span>
          <p className="font-medium">{formatWei(contribution)} ETH</p>
        </div>
        {saleInfo && (
          <div>
            <span className="text-gray-500">Token price</span>
            <p className="font-medium">{formatWei(saleInfo.tokenPrice)} ETH</p>
          </div>
        )}
      </div>

      {/* Amount input */}
      <div>
        <label htmlFor="contribution-amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount (ETH)
        </label>
        <input
          id="contribution-amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setInputError('');
          }}
          placeholder="0.0"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-describedby={inputError ? 'contribution-error' : undefined}
          aria-invalid={!!inputError}
        />
        {inputError && (
          <p id="contribution-error" className="mt-1 text-sm text-red-600" role="alert">
            {inputError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={txState.status === 'pending' || txState.status === 'confirming'}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {txState.status === 'pending'
          ? 'Confirm in wallet…'
          : txState.status === 'confirming'
            ? 'Confirming…'
            : 'Contribute'}
      </button>
    </form>
  );
}
