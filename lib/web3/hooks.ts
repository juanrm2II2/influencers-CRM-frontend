'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useCallback, useMemo } from 'react';
import { TOKEN_SALE_ABI, VESTING_ABI, CONTRACT_ADDRESSES } from './contracts';
import { EXPECTED_CHAIN_ID } from './config';
import type { TokenSaleInfo, VestingSchedule, TransactionState, KycVerification, KycStatus } from '@/types/web3';
import { getKycStatus, createKycAccessToken } from '@/lib/kyc';

// ─── Shared helper: derive final tx state from write-state + receipt ─────────

type WriteState = {
  status: 'idle' | 'pending' | 'confirming' | 'failed';
  hash?: `0x${string}`;
  error?: string;
};

function deriveTransactionState(
  writeState: WriteState,
  receipt: { transactionHash: `0x${string}`; blockNumber: bigint; gasUsed: bigint; status: 'success' | 'reverted' } | undefined,
): TransactionState {
  if (writeState.status === 'confirming' && receipt) {
    return {
      status: receipt.status === 'success' ? 'confirmed' : 'failed',
      hash: writeState.hash,
      receipt: {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status,
      },
      error: receipt.status === 'reverted' ? 'Transaction reverted' : undefined,
    };
  }
  return writeState;
}

// ─── Chain-ID guard: ensure the wallet is on the expected network ────────────

export class ChainMismatchError extends Error {
  constructor(
    public readonly expected: number,
    public readonly actual: number | undefined,
  ) {
    super(
      actual === undefined
        ? 'Wallet is not connected to any network'
        : `Wrong network: expected chain ${expected} but wallet is on chain ${actual}`,
    );
    this.name = 'ChainMismatchError';
  }
}

/**
 * Returns an async helper that verifies the wallet is on {@link EXPECTED_CHAIN_ID}.
 * If the chain is wrong it will attempt to switch automatically via
 * `useSwitchChain`. If switching fails (user rejection, unsupported chain, …)
 * a {@link ChainMismatchError} is thrown so callers can surface it in the UI.
 */
export function useChainGuard() {
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const ensureCorrectChain = useCallback(async () => {
    if (chainId === EXPECTED_CHAIN_ID) return;

    try {
      await switchChainAsync({ chainId: EXPECTED_CHAIN_ID });
    } catch {
      throw new ChainMismatchError(EXPECTED_CHAIN_ID, chainId);
    }
  }, [chainId, switchChainAsync]);

  return { ensureCorrectChain };
}

// ─── Token Sale Info ─────────────────────────────────────────────────────────

export function useTokenSaleInfo() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.tokenSale,
    abi: TOKEN_SALE_ABI,
    functionName: 'saleInfo',
  });

  const saleInfo: TokenSaleInfo | null = useMemo(() => {
    if (!data) return null;
    const [
      totalTokens,
      tokensSold,
      tokenPrice,
      hardCap,
      softCap,
      totalRaised,
      startTime,
      endTime,
      isActive,
      isPaused,
    ] = data;
    return {
      totalTokens,
      tokensSold,
      tokenPrice,
      hardCap,
      softCap,
      totalRaised,
      startTime: Number(startTime),
      endTime: Number(endTime),
      isActive,
      isPaused,
    };
  }, [data]);

  return { saleInfo, isLoading, error, refetch };
}

// ─── User contribution ───────────────────────────────────────────────────────

export function useUserContribution(address: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.tokenSale,
    abi: TOKEN_SALE_ABI,
    functionName: 'contributions',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return { contribution: data ?? BigInt(0), isLoading, refetch };
}

// ─── Whitelist status ────────────────────────────────────────────────────────

export function useWhitelistStatus(address: `0x${string}` | undefined) {
  const whitelisted = useReadContract({
    address: CONTRACT_ADDRESSES.tokenSale,
    abi: TOKEN_SALE_ABI,
    functionName: 'isWhitelisted',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const allocation = useReadContract({
    address: CONTRACT_ADDRESSES.tokenSale,
    abi: TOKEN_SALE_ABI,
    functionName: 'whitelistAllocation',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    isWhitelisted: whitelisted.data ?? false,
    maxContribution: allocation.data ?? BigInt(0),
    isLoading: whitelisted.isLoading || allocation.isLoading,
    refetch: () => {
      whitelisted.refetch();
      allocation.refetch();
    },
  };
}

// ─── Contribute ──────────────────────────────────────────────────────────────

export function useContribute() {
  const [writeState, setWriteState] = useState<WriteState>({ status: 'idle' });
  const { writeContractAsync } = useWriteContract();
  const { ensureCorrectChain } = useChainGuard();

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: writeState.hash,
    query: { enabled: !!writeState.hash },
  });

  const txState = deriveTransactionState(writeState, receipt);

  const contribute = useCallback(
    async (amountEth: string) => {
      try {
        setWriteState({ status: 'pending' });
        await ensureCorrectChain();
        const value = parseEther(amountEth);
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.tokenSale,
          abi: TOKEN_SALE_ABI,
          functionName: 'contribute',
          value,
        });
        setWriteState({ status: 'confirming', hash });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setWriteState({ status: 'failed', error: message });
      }
    },
    [writeContractAsync, ensureCorrectChain],
  );

  const reset = useCallback(() => setWriteState({ status: 'idle' }), []);

  return { txState, contribute, reset };
}

// ─── Vesting schedule ────────────────────────────────────────────────────────

export function useVestingSchedule(address: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.vesting,
    abi: VESTING_ABI,
    functionName: 'getVestingSchedule',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const schedule: VestingSchedule | null = useMemo(() => {
    if (!data) return null;
    const [totalAmount, releasedAmount, startTime, cliffDuration, vestingDuration, revocable, revoked] = data;
    return {
      totalAmount,
      releasedAmount,
      startTime: Number(startTime),
      cliffDuration: Number(cliffDuration),
      vestingDuration: Number(vestingDuration),
      revocable,
      revoked,
    };
  }, [data]);

  return { schedule, isLoading, error, refetch };
}

// ─── Releasable amount ───────────────────────────────────────────────────────

export function useReleasableAmount(address: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.vesting,
    abi: VESTING_ABI,
    functionName: 'releasableAmount',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return { releasable: data ?? BigInt(0), isLoading, refetch };
}

// ─── Claim vested tokens ─────────────────────────────────────────────────────

export function useClaimVestedTokens() {
  const [writeState, setWriteState] = useState<WriteState>({ status: 'idle' });
  const { writeContractAsync } = useWriteContract();
  const { ensureCorrectChain } = useChainGuard();

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: writeState.hash,
    query: { enabled: !!writeState.hash },
  });

  const txState = deriveTransactionState(writeState, receipt);

  const claim = useCallback(async () => {
    try {
      setWriteState({ status: 'pending' });
      await ensureCorrectChain();
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.vesting,
        abi: VESTING_ABI,
        functionName: 'release',
      });
      setWriteState({ status: 'confirming', hash });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setWriteState({ status: 'failed', error: message });
    }
  }, [writeContractAsync, ensureCorrectChain]);

  const reset = useCallback(() => setWriteState({ status: 'idle' }), []);

  return { txState, claim, reset };
}

// ─── Whitelist management (admin) ────────────────────────────────────────────

export function useWhitelistManagement() {
  const [writeState, setWriteState] = useState<WriteState>({ status: 'idle' });
  const { writeContractAsync } = useWriteContract();
  const { ensureCorrectChain } = useChainGuard();

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: writeState.hash,
    query: { enabled: !!writeState.hash },
  });

  const txState = deriveTransactionState(writeState, receipt);

  const addToWhitelist = useCallback(
    async (accounts: `0x${string}`[], maxContributions: bigint[]) => {
      try {
        setWriteState({ status: 'pending' });
        await ensureCorrectChain();
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.tokenSale,
          abi: TOKEN_SALE_ABI,
          functionName: 'addToWhitelist',
          args: [accounts, maxContributions],
        });
        setWriteState({ status: 'confirming', hash });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setWriteState({ status: 'failed', error: message });
      }
    },
    [writeContractAsync, ensureCorrectChain],
  );

  const removeFromWhitelist = useCallback(
    async (accounts: `0x${string}`[]) => {
      try {
        setWriteState({ status: 'pending' });
        await ensureCorrectChain();
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.tokenSale,
          abi: TOKEN_SALE_ABI,
          functionName: 'removeFromWhitelist',
          args: [accounts],
        });
        setWriteState({ status: 'confirming', hash });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setWriteState({ status: 'failed', error: message });
      }
    },
    [writeContractAsync, ensureCorrectChain],
  );

  const reset = useCallback(() => setWriteState({ status: 'idle' }), []);

  return { txState, addToWhitelist, removeFromWhitelist, reset };
}

// ─── KYC verification ────────────────────────────────────────────────────────

export function useKycVerification(address: `0x${string}` | undefined) {
  const [verification, setVerification] = useState<KycVerification>({ status: 'none' as KycStatus });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getKycStatus(address);
      setVerification(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch KYC status';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const requestToken = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected');
    return createKycAccessToken(address);
  }, [address]);

  return {
    verification,
    isVerified: verification.status === 'approved',
    isLoading,
    error,
    fetchStatus,
    requestToken,
  };
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

export function formatWei(wei: bigint): string {
  return formatEther(wei);
}

export function formatTokenAmount(amount: bigint, decimals = 18): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  const fractional = remainder.toString().padStart(decimals, '0').slice(0, 4);
  return `${whole.toString()}.${fractional}`;
}
