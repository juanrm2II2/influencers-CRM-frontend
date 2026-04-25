# Runbook — Wrong-chain or wrong-contract deployment

**Trigger:** A production build is observed serving the wrong
`NEXT_PUBLIC_TOKEN_SALE_ADDRESS`, `NEXT_PUBLIC_VESTING_ADDRESS`, or
`NEXT_PUBLIC_EXPECTED_CHAIN_ID`. Detected via:

- Manual smoke check post-deploy.
- User reports of "this isn't the official sale".
- Etherscan / contract-scanner alerts on a lookalike address.

**Default severity:** **SEV-1** if the wrong address could route user funds;
SEV-2 if only the chain id mismatches and writes are guarded.

## Containment (act first, investigate second)

1. **Roll back the deploy** in the hosting provider (Vercel: "Promote previous
   deployment"; equivalent on other providers). This is faster than landing a
   fix.
2. If rollback is not possible, **freeze the contribution form** by setting a
   feature flag or hot-patching `components/web3/ContributionForm.tsx` to render
   a maintenance notice, then redeploying.
3. Post a banner on the status page and pinned tweet/Discord notice. Do **not**
   speculate on attribution publicly.

## Investigation

1. Compare the deployed env values against the canonical values in
   `SECURITY_CONTACTS.md` / treasury runbook.
2. Inspect CI logs for the build that deployed the bad value
   (`.github/workflows/ci.yml` → build job env).
3. Diff the GitHub Actions / hosting-provider env-var configuration against the
   last known-good state.
4. Confirm the chain-id guard worked: `lib/web3/config.ts`
   (`EXPECTED_CHAIN_ID`) and `lib/web3/hooks.ts` write hooks should have
   blocked any tx on the wrong chain.
5. Pull on-chain logs for the suspicious address — was anyone affected?

## Recovery

1. Restore the correct env values in the hosting provider.
2. Trigger a fresh build from a known-good commit.
3. Verify on a preview URL **before** promoting to production.
4. Remove the maintenance banner.

## Confirm recovery

- [ ] `view-source:` of the production page shows the expected addresses in the
      hydrated bundle.
- [ ] Chain id displayed in the wallet-connect UI matches expectation.
- [ ] A small test contribution from a controlled wallet succeeds.
- [ ] Sentry / error feed shows no spike in `useContribute` failures.

## Follow-ups

- Lock the env-var-edit permission in the hosting provider to a 2-person rule.
- Add a build-time assertion that fails CI if the address is on a hard-coded
  deny-list (zero address, dEaD/bEEF placeholders) when building from `main`.
- Add a deploy-time smoke test (Playwright) that asserts the on-page contract
  address matches a value fetched from a separate, signed source.
