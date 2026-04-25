# Runbook — Contribution-transaction failure spike

**Trigger:**

- Sustained increase in failed `useContribute` / write-hook errors above
  baseline.
- User reports of "transaction reverted" with no obvious user error.

**Default severity:** **SEV-1** if the cause may indicate a contract issue or
exploit; **SEV-2** if the cause is RPC/UX-only.

## Containment

1. **Immediately determine whether failures are reverts on-chain or client-side
   pre-flight failures.** This determines who owns it (contract team vs.
   frontend).
2. If reverts indicate the contract may be in an unexpected state (paused,
   over-cap, blacklisted addresses), surface a clear error in the UI and
   coordinate with the contract owners. **Do not** advise users to retry.
3. If the failures are pre-flight (chain-id, allowance, KYC gate), check the
   gate logic and prepare a fix.
4. If a contract exploit is suspected, escalate to the contract team to invoke
   pause via the multisig (out of this repo's scope).

## Investigation

1. Sample 5–10 failed tx hashes and inspect on Etherscan: revert reason,
   selector, gas used.
2. Match revert reasons against contract source. Common categories:
   - `Sale/not-active` — sale closed; coordinate timing fix.
   - `Sale/cap-exceeded` — see `hard-cap-approaching.md`.
   - `KYC/not-verified` — gate desync between frontend and backend.
   - `Whitelist/not-allowed` — allow-list state out of sync.
3. Inspect chain-id guard (`EXPECTED_CHAIN_ID` in `lib/web3/config.ts`) — a
   mismatch should fail before submission, not on-chain.
4. Compare contribution path against last working release; bisect if needed.

## Recovery

- For UI-side fixes (e.g., wrong allowance check), land minimal patch and
  redeploy.
- For contract-side state issues, the contract team's runbook owns recovery;
  this repo's role is accurate user comms.

## Confirm recovery

- [ ] Failure rate returns to baseline.
- [ ] Test contribution from a controlled wallet succeeds.
- [ ] Error messaging in the UI clearly maps revert reasons to user
      explanations.

## Follow-ups

- Add structured error codes from contract reverts into the UI mapping.
- Alert thresholds (out of repo) tuned to fire earlier next time.
