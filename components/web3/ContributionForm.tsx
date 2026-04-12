// components/web3/ContributionForm.tsx
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useKycVerification } from '@/lib/web3/hooks';


type TxStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export interface TxState {
  status: TxStatus;
  txHash?: string;
  errorMessage?: string;
}

export default function ContributionForm(): JSX.Element {
  const { address, isConnected } = useAccount();
  const { isVerified, verification, isLoading: kycLoading, fetchStatus } =
    useKycVerification(address);
  const [amount, setAmount] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');
  const [txState, setTxState] = useState<TxState>({ status: 'idle' });

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

    // Update UI state to pending
    setTxState({ status: 'pending' });

    try {
      // === PLACEHOLDER: replace with your actual web3/send transaction logic ===
      // Example pseudocode:
      // const txResponse = await contract.methods.contribute().send({ value: toWei(amount) });
      // setTxState({ status: 'confirming', txHash: txResponse.hash });
      //
      // await txResponse.wait(); // wait for confirmation
      // setTxState({ status: 'success', txHash: txResponse.hash });
      //
      // For now we simulate a short delay to demonstrate state transitions:
      await simulateTxFlow();
      // ========================================================================

      // If simulateTxFlow resolves without throwing, mark success
      // (simulateTxFlow already sets confirming and success via setTxState)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Transaction failed';
      setTxState({ status: 'error', errorMessage: message });
    }
  }

  // Small helper to simulate a transaction lifecycle for demo / dev
  async function simulateTxFlow() {
    // set confirming after a short delay to mimic network propagation
    await delay(700);
    setTxState((prev) => ({ ...prev, status: 'confirming' }));

    // simulate waiting for confirmation
    await delay(1200);

    // simulate success
    setTxState({ status: 'success', txHash: '0xSIMULATED_HASH' });

    // reset to idle after a short time so the form can be reused
    await delay(1200);
    setTxState({ status: 'idle' });
    setAmount('');
  }

  function delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
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

      {txState.status === 'error' && txState.errorMessage && (
        <div className="text-sm text-red-600">Error: {txState.errorMessage}</div>
      )}

      {txState.status === 'success' && txState.txHash && (
        <div className="text-sm text-green-600">
          Transaction confirmed: <span className="font-mono">{txState.txHash}</span>
        </div>
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
