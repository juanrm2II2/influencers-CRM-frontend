# Runbook — RPC provider degraded

**Trigger:**

- WalletConnect / Alchemy / Infura status feed shows degradation.
- Spike in `useReadContract` errors or stale on-chain data displayed in the UI.
- Users report "transactions stuck pending" or "wrong balance shown".

**Default severity:** **SEV-2** during an active sale window; **SEV-3**
otherwise.

## Containment

1. Show a banner indicating chain data may be stale; encourage users to refresh
   before submitting transactions.
2. Pause non-essential read calls if rate-limited (e.g., dashboards) to keep
   contribution-path quotas available.
3. Do **not** hot-swap RPC endpoints in production without review — a wrong
   endpoint can serve a forked chain view.

## Investigation

1. Confirm the issue is upstream by hitting the provider's status page from a
   different network.
2. Inspect `lib/web3/config.ts` for the configured chain id and the wagmi
   transports / connectors used in `wagmi.config.ts` (or equivalent).
3. Check whether wallet connectors (RainbowKit / WalletConnect) report an
   error vs. our own reads. If only our reads fail, suspect our config; if all
   wallets fail, suspect the provider.
4. Look for recent commits touching RPC/transport configuration.

## Recovery

- When the provider recovers, remove the banner.
- If a switch to a backup RPC is needed, prefer a configuration change in the
  hosting environment (env var or feature flag) over a code change, so it can
  be reverted instantly.

## Confirm recovery

- [ ] `useReadContract` round-trips return current block within expected
      latency.
- [ ] A test wallet sees a fresh contribution reflected within one block of
      confirmation.
- [ ] No spike in failed-tx errors.

## Follow-ups

- Configure a secondary RPC endpoint for failover.
- Add latency / error-rate dashboards to the monitoring stack (out of repo —
  see `SECURITY_CONTACTS.md`).
- Consider `wagmi`'s `fallback` transport if not already in use.
