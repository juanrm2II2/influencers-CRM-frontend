'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useCallback, useMemo } from 'react';
import { TOKEN_SALE_ABI, VESTING_ABI, CONTRACT_ADDRESSES } from './contracts';
import type { TokenSaleInfo, VestingSchedule, TransactionState } from '@/types/web3';

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
  const [txState, setTxState] = useState<TransactionState>({ status: 'idle' });
  const { writeContractAsync } = useWriteContract();

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txState.hash,
    query: { enabled: !!txState.hash },
  });

  // Update state when receipt arrives
  useMemo(() => {
    if (receipt && txState.status === 'confirming') {
      setTxState({
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
        hash: txState.hash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed,
          status: receipt.status,
        },
        error: receipt.status === 'reverted' ? 'Transaction reverted' : undefined,
      });
    }
  }, [receipt, txState.status, txState.hash]);

  const contribute = useCallback(
    async (amountEth: string) => {
      try {
        setTxState({ status: 'pending' });
        const value = parseEther(amountEth);
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.tokenSale,
          abi: TOKEN_SALE_ABI,
          functionName: 'contribute',
          value,
        });
        setTxState({ status: 'confirming', hash });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setTxState({ status: 'failed', error: message });
      }
    },
    [writeContractAsync],
  );

  const reset = useCallback(() => setTxState({ status: 'idle' }), []);

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
  const [txState, setTxState] = useState<TransactionState>({ status: 'idle' });
  const { writeContractAsync } = useWriteContract();

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txState.hash,
    query: { enabled: !!txState.hash },
  });

  useMemo(() => {
    if (receipt && txState.status === 'confirming') {
      setTxState({
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
        hash: txState.hash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed,
          status: receipt.status,
        },
        error: receipt.status === 'reverted' ? 'Transaction reverted' : undefined,
      });
    }
  }, [receipt, txState.status, txState.hash]);

  const claim = useCallback(async () => {
    try {
      setTxState({ status: 'pending' });
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.vesting,
        abi: VESTING_ABI,
        functionName: 'release',
      });
      setTxState({ status: 'confirming', hash });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setTxState({ status: 'failed', error: message });
    }
  }, [writeContractAsync]);

  const reset = useCallback(() => setTxState({ status: 'idle' }), []);

  return { txState, claim, reset };
}

// ─── Whitelist management (admin) ────────────────────────────────────────────

export function useWhitelistManagement() {
  const [txState, setTxState] = useState<TransactionState>({ status: 'idle' });
  const { writeContractAsync } = useWriteContract();

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txState.hash,
    query: { enabled: !!txState.hash },
  });

  useMemo(() => {
    if (receipt && txState.status === 'confirming') {
      setTxState({
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
        hash: txState.hash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed,
          status: receipt.status,
        },
        error: receipt.status === 'reverted' ? 'Transaction reverted' : undefined,
      });
    }
  }, [receipt, txState.status, txState.hash]);

  const addToWhitelist = useCallback(
    async (accounts: `0x${string}`[], maxContributions: bigint[]) => {
      try {
        setTxState({ status: 'pending' });
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.tokenSale,
          abi: TOKEN_SALE_ABI,
          functionName: 'addToWhitelist',
          args: [accounts, maxContributions],
        });
        setTxState({ status: 'confirming', hash });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setTxState({ status: 'failed', error: message });
      }
    },
    [writeContractAsync],
  );

  const removeFromWhitelist = useCallback(
    async (accounts: `0x${string}`[]) => {
      try {
        setTxState({ status: 'pending' });
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.tokenSale,
          abi: TOKEN_SALE_ABI,
          functionName: 'removeFromWhitelist',
          args: [accounts],
        });
        setTxState({ status: 'confirming', hash });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setTxState({ status: 'failed', error: message });
      }
    },
    [writeContractAsync],
  );

  const reset = useCallback(() => setTxState({ status: 'idle' }), []);

  return { txState, addToWhitelist, removeFromWhitelist, reset };
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
