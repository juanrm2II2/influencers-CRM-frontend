# Runbook — Hard-cap approaching / reached

**Trigger:**

- Sale `totalRaised` within 5% of the hard cap.
- Contract emits the cap-reached event.

**Default severity:** **SEV-3** (planned event), but elevate to SEV-2 if the
UI does not reflect closure within one minute of cap being hit.

## Pre-event preparation (do once, before the sale)

1. Verify the UI shows real-time progress against the cap (`ContributionForm`
   should read `totalRaised` and `hardCap` from the contract).
2. Verify the contribution form disables the submit button and shows a
   "Sale closed" state when the cap is reached.
3. Have a "Sale closed" landing page ready as a fallback if the contract
   read fails.

## During the event

1. Monitor the contract reads vs. on-chain truth (Etherscan).
2. If a race condition causes overcontribution, the contract should reject —
   verify with the contract team that no off-by-one is possible.
3. Comms Lead posts the closure announcement once cap is on-chain confirmed.

## Containment (if UI does not close cleanly)

1. Force-deploy a static "Sale closed" override — use a feature flag if
   available, otherwise a one-line patch to `ContributionForm.tsx` returning
   the closed state regardless of read result.
2. Roll out within minutes; this is higher priority than diagnosing the
   underlying read failure.

## Confirm closure

- [ ] No further contribution transactions accepted on-chain.
- [ ] UI shows "Sale closed" with final raised amount.
- [ ] Status page updated.
- [ ] Public announcements posted.

## Follow-ups

- Refund flow (if applicable) tested before activation.
- Vesting page accuracy checked — `NEXT_PUBLIC_VESTING_ADDRESS` should now
  display real allocations.
