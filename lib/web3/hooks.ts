'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain, useSignMessage } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useCallback, useMemo } from 'react';
import { TOKEN_SALE_ABI, VESTING_ABI, CONTRACT_ADDRESSES } from './contracts';
import { EXPECTED_CHAIN_ID } from './config';
import type { TokenSaleInfo, VestingSchedule, TransactionState, KycVerification, KycStatus } from '@/types/web3';
import { getKycStatus, createKycAccessToken } from '@/lib/kyc';
import { performSiwe } from './siwe';

// ─── Shared helper: derive final tx state from write-state + receipt ─────────

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Throws if a contract address is the zero address, which indicates the
 * corresponding `NEXT_PUBLIC_*_ADDRESS` env var was not supplied. Without
 * this guard a user's wallet could be prompted to send ETH to `0x0…0`,
 * which would be unrecoverable.
 *
 * @internal Exported for unit tests only.
 */
export function assertContractConfigured(address: `0x${string}`, label: string): void {
  if (address.toLowerCase() === ZERO_ADDRESS) {
    throw new Error(
      `${label} contract address is not configured. ` +
        `Set the corresponding NEXT_PUBLIC_*_ADDRESS environment variable to the deployed contract address.`,
    );
  }
}

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
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.tokenSale,
    abi: TOKEN_SALE_ABI,
    functionName: 'contributions',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Audit L-04: distinguish "RPC returned undefined" from "user has
  // contributed 0". The previous shape collapsed both into `0n`, which
  // caused the UI to render "0 contributed" when the correct message
  // was "unknown — please retry".
  return {
    contribution: typeof data === 'bigint' ? data : undefined,
    isLoading,
    error: error ?? null,
    refetch,
  };
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

/**
 * Hard-coded sane defaults for the contribution range. They can be
 * overridden per deployment with `NEXT_PUBLIC_MIN_CONTRIBUTION_ETH` and
 * `NEXT_PUBLIC_MAX_CONTRIBUTION_ETH`. Strings (not numbers) so the
 * 18-decimal precision of `parseEther` is preserved end-to-end and
 * floating-point rounding can never round a min/max into a value the
 * contract would reject.
 */
function readContributionEnv(name: string, fallback: string): string {
  const raw = process.env[name];
  if (typeof raw !== 'string' || raw.trim() === '') return fallback;
  // Validate the override is a syntactically valid decimal so a bad env
  // var cannot poison the bounds at runtime — falls back to the default
  // and warns once per page lifetime.
  if (!/^\d+(\.\d{1,18})?$/.test(raw.trim())) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[web3] ${name}="${raw}" is not a valid decimal; falling back to ${fallback}.`);
    }
    return fallback;
  }
  return raw.trim();
}

const MIN_CONTRIBUTION_ETH_STR = readContributionEnv('NEXT_PUBLIC_MIN_CONTRIBUTION_ETH', '0.01');
const MAX_CONTRIBUTION_ETH_STR = readContributionEnv('NEXT_PUBLIC_MAX_CONTRIBUTION_ETH', '100');
/** Soft cap above which the user must explicitly confirm the amount. */
const SOFT_CAP_ETH_STR = readContributionEnv('NEXT_PUBLIC_SOFT_CAP_CONTRIBUTION_ETH', '10');

export const MIN_CONTRIBUTION_WEI = parseEther(MIN_CONTRIBUTION_ETH_STR);
export const MAX_CONTRIBUTION_WEI = parseEther(MAX_CONTRIBUTION_ETH_STR);
export const SOFT_CAP_WEI = parseEther(SOFT_CAP_ETH_STR);

export class InvalidContributionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidContributionError';
  }
}

/**
 * Validate a user-supplied contribution amount **before** it is handed to
 * `parseEther`, which would otherwise throw on malformed strings or
 * silently truncate beyond 18 decimals (audit H-02).
 *
 * Rules:
 *   - must be a non-empty string
 *   - decimal-only (no scientific notation / hex / leading sign / spaces)
 *   - <= 18 fractional digits (parseEther truncates anything beyond)
 *   - strictly > 0
 *   - within `[MIN_CONTRIBUTION_WEI, MAX_CONTRIBUTION_WEI]`
 *
 * Returns the parsed wei value on success; throws
 * {@link InvalidContributionError} on any rule violation. Exported for
 * unit tests.
 *
 * @param options.confirmedAboveSoftCap  When the parsed amount exceeds
 *   `SOFT_CAP_WEI`, callers must pass `true` here (typically gated on a
 *   confirmation dialog). This catches fat-finger contributions
 *   (`1000` instead of `1`) before the wallet prompt appears.
 */
export function parseContributionAmount(
  amountEth: string,
  options?: { confirmedAboveSoftCap?: boolean },
): bigint {
  if (typeof amountEth !== 'string') {
    throw new InvalidContributionError('Amount is required.');
  }
  const trimmed = amountEth.trim();
  if (trimmed === '') {
    throw new InvalidContributionError('Amount is required.');
  }
  // Strict decimal notation. No leading +/-, no exponent, no hex.
  // The fractional part is capped at 18 digits because `parseEther`
  // silently truncates anything past 18 — we want to reject the input
  // up-front rather than send a different value than the user typed.
  if (!/^\d+(\.\d{1,18})?$/.test(trimmed)) {
    if (/^\d+\.\d{19,}$/.test(trimmed)) {
      throw new InvalidContributionError(
        'Amount has too many decimals (max 18).',
      );
    }
    throw new InvalidContributionError(
      'Amount must be a positive decimal number (e.g. "1.5").',
    );
  }
  let value: bigint;
  try {
    value = parseEther(trimmed);
  } catch {
    throw new InvalidContributionError('Amount could not be parsed as ETH.');
  }
  if (value <= 0n) {
    throw new InvalidContributionError('Amount must be greater than 0.');
  }
  if (value < MIN_CONTRIBUTION_WEI) {
    throw new InvalidContributionError(
      `Amount is below the minimum contribution (${MIN_CONTRIBUTION_ETH_STR} ETH).`,
    );
  }
  if (value > MAX_CONTRIBUTION_WEI) {
    throw new InvalidContributionError(
      `Amount exceeds the maximum contribution (${MAX_CONTRIBUTION_ETH_STR} ETH).`,
    );
  }
  if (value > SOFT_CAP_WEI && !options?.confirmedAboveSoftCap) {
    throw new InvalidContributionError(
      `Amount exceeds ${SOFT_CAP_ETH_STR} ETH; please confirm the value before sending.`,
    );
  }
  return value;
}

/**
 * Validate an admin-supplied whitelist *cap* amount. Audit M-07: the
 * H-02 validator (`parseContributionAmount`) is the only sanctioned
 * path from a wei-bound user string to `parseEther` on this frontend;
 * the admin whitelist path used to call `parseEther` directly via
 * `Number(amountStr) > 0`, which silently accepted scientific notation
 * (`1e18`), leading sign, hex, and >18-decimal precision-losing input.
 *
 * `parseWhitelistAmount` shares the exact same regex / decimal-bound
 * rules as the contribution validator, but it is intentionally **not**
 * subject to the SOFT/MIN bounds (those are user-facing contribution
 * thresholds — admin caps may legitimately be smaller or larger). It
 * still enforces:
 *   - decimal-only string (no exponent / hex / sign / spaces)
 *   - <= 18 fractional digits
 *   - strictly > 0
 *   - <= MAX_CONTRIBUTION_WEI (so a fat-finger CSV cannot whitelist a
 *     cap that would silently overflow downstream type assumptions).
 *
 * Throws {@link InvalidContributionError} on any rule violation. Same
 * error class is reused so existing error rendering code does not have
 * to special-case the whitelist surface.
 */
export function parseWhitelistAmount(amountEth: string): bigint {
  if (typeof amountEth !== 'string') {
    throw new InvalidContributionError('Amount is required.');
  }
  if (amountEth === '') {
    throw new InvalidContributionError('Amount is required.');
  }
  // Audit M-07: validate the *raw* string with no implicit trim. The
  // CSV parser in WhitelistManager already trims each cell before
  // calling us, so any whitespace reaching this point is a sign of
  // corrupted input (e.g. a stray non-breaking space) and must be
  // rejected up-front rather than coerced silently.
  if (!/^\d+(\.\d{1,18})?$/.test(amountEth)) {
    if (/^\s*\d+\.\d{19,}\s*$/.test(amountEth)) {
      throw new InvalidContributionError(
        'Amount has too many decimals (max 18).',
      );
    }
    throw new InvalidContributionError(
      'Amount must be a positive decimal number (e.g. "1.5").',
    );
  }
  let value: bigint;
  try {
    value = parseEther(amountEth);
  } catch {
    throw new InvalidContributionError('Amount could not be parsed as ETH.');
  }
  if (value <= 0n) {
    throw new InvalidContributionError('Amount must be greater than 0.');
  }
  if (value > MAX_CONTRIBUTION_WEI) {
    throw new InvalidContributionError(
      `Amount exceeds the maximum contribution (${MAX_CONTRIBUTION_ETH_STR} ETH).`,
    );
  }
  return value;
}

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
    async (
      amountEth: string,
      options?: { confirmedAboveSoftCap?: boolean },
    ) => {
      try {
        setWriteState({ status: 'pending' });
        assertContractConfigured(CONTRACT_ADDRESSES.tokenSale, 'Token sale');
        // Validate BEFORE prompting the wallet so the user sees a
        // human-readable message instead of `parseEther`'s opaque
        // throw or — worse — a silent decimal truncation.
        const value = parseContributionAmount(amountEth, options);
        await ensureCorrectChain();
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
      assertContractConfigured(CONTRACT_ADDRESSES.vesting, 'Vesting');
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
        assertContractConfigured(CONTRACT_ADDRESSES.tokenSale, 'Token sale');
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
        assertContractConfigured(CONTRACT_ADDRESSES.tokenSale, 'Token sale');
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

// ─── SIWE: bind connected wallet to the backend session ─────────────────────

/**
 * Hook that exposes the SIWE flow. Call `signIn()` after the wallet is
 * connected (and the user has an authenticated backend session). On success
 * the backend associates the wallet with the session and subsequent API
 * calls (e.g. KYC) can rely on the session wallet — no `wallet` query
 * parameter or body field is needed from the client.
 */
export function useSiwe() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<'idle' | 'signing' | 'verifying' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected');
    setError(null);
    try {
      setStatus('signing');
      // The SIWE message is bound to EXPECTED_CHAIN_ID by `performSiwe`;
      // we intentionally do NOT pass the wallet's current chainId so a
      // signature on the "wrong" network cannot be produced client-side.
      await performSiwe({
        address,
        signMessage: async ({ message, account }) =>
          signMessageAsync({ message, account }),
      });
      setStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SIWE sign-in failed';
      setError(message);
      setStatus('error');
      throw err;
    }
  }, [address, signMessageAsync]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { status, error, signIn, reset };
}

// ─── KYC verification ────────────────────────────────────────────────────────

export function useKycVerification(address: `0x${string}` | undefined) {
  const [verification, setVerification] = useState<KycVerification>({ status: 'none' as KycStatus });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `address` is retained in the signature so callers can gate fetches on
  // wallet connection, but it is no longer sent to the backend — the backend
  // resolves the wallet from the SIWE-bound session.
  const fetchStatus = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getKycStatus();
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
    return createKycAccessToken();
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
