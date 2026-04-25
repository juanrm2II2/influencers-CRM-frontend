# Runbook — KYC vendor outage (SumSub)

**Trigger:**

- SumSub status page reports degradation/outage.
- Spike in failed `useKycVerification` calls in error tracking.
- User reports of "verification stuck" / "iframe blank".

**Default severity:** **SEV-2** during an active sale window; **SEV-3**
otherwise. KYC outages directly block new contributions.

## Containment

1. Display a clear banner on the contribution page explaining KYC is
   temporarily unavailable, with an ETA if SumSub has provided one. Use the
   existing `KycVerificationBanner.tsx` component slot — do not bypass the
   gate.
2. **Never** silently bypass `isVerified` to unblock contributions. The gate
   is a regulatory control, not a UX nicety.
3. Pin the SumSub status URL in the banner so users can self-serve updates.

## Investigation

1. Confirm the outage is upstream by hitting SumSub's status feed, not just
   our app.
2. Check `lib/kyc.ts` and the backend KYC proxy for any recent changes that
   could have coincided with the failure.
3. Verify CSP is not the cause: `connect-src` and `frame-src` must include
   `*.sumsub.com` (see `lib/csp.ts`). A recent CSP edit could have broken the
   iframe.
4. Inspect a fresh applicant flow in an incognito window to rule out
   client-side caching issues.

## Recovery

- When SumSub recovers, remove the banner and announce.
- If the outage is prolonged, coordinate with Compliance about queueing
  applicants (collecting interest, not submitting documents elsewhere) — never
  store ID images outside SumSub.

## Confirm recovery

- [ ] Test applicant completes the WebSDK flow end-to-end in production.
- [ ] `useKycVerification` returns `verified: true` post-completion.
- [ ] Contribution form unblocks for the test applicant.

## Follow-ups

- Track SumSub uptime against SLA; raise with vendor if recurring.
- Evaluate a secondary KYC vendor if SumSub becomes a single point of failure
  for the sale window. Vendor selection is a legal/compliance decision — see
  `SECURITY_CONTACTS.md`.
