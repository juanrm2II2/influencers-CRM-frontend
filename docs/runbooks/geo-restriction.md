# Runbook — Geo-restriction (planned control)

**Status:** Documented, **not implemented**. This file describes the control
we intend to ship and the gating items required before we do.

## Why this is documented but not implemented

Jurisdictional access control for a token sale is a **legal**, not a
technical, decision. Implementing the wrong country list — too permissive,
too restrictive, or applied without proper notice — creates regulatory and
reputational risk that no code change can fix. This runbook exists so that
when external counsel signs off on the list, the engineering work is a
small, well-scoped change and not a from-scratch design exercise.

## Decision required from counsel

Before implementation, external counsel must provide, in writing:

1. The list of **blocked jurisdictions** (typically: US persons unless the
   sale is registered or exempt; OFAC sanctioned countries — currently Cuba,
   Iran, North Korea, Syria, Russia-occupied regions of Ukraine; plus
   jurisdiction-specific securities-law restrictions).
2. The **basis for blocking** (regulatory citation), so it can be surfaced in
   the UI for transparency.
3. The **acceptable signals** for determining jurisdiction (IP geo? wallet
   address heuristics? user attestation? KYC data?). Each has different
   evasion characteristics and legal weight.
4. The **acceptable false-positive rate** — a stricter regime (e.g., block on
   any signal) trades user friction for compliance margin.
5. Whether a **wallet attestation** ("I am not a US person …") is sufficient
   in the relevant jurisdictions, or if affirmative geo-blocking is also
   required.

## Proposed implementation (for when sign-off lands)

Implementation should live in **two layers**, defense in depth:

1. **Edge layer** in `middleware.ts`:
   - Read `request.geo.country` (Vercel) or equivalent header from the CDN.
   - For blocked countries, return a 451 response rendering a
     `/jurisdiction-restricted` page with the regulatory rationale.
   - Apply only to token-sale routes (`/token-sale/*`), not to public marketing
     pages.
   - Do **not** rely on geo alone — it must be backed by KYC and an explicit
     attestation.
2. **Server layer** in the backend:
   - Refuse to issue a KYC applicant token for blocked countries.
   - Refuse to whitelist a wallet whose KYC data indicates a blocked country.
3. **Contract layer** (out of this repo):
   - Whitelist-only contributions ensure that even with a UI bypass, only
     pre-approved wallets can contribute.

The country list belongs in **a single configuration source** (env var or
checked-in JSON) referenced by both layers, never duplicated.

## Out of scope here

- VPN detection (high false-positive rate; counsel decides whether worth it).
- Address-clustering analysis to flag prior US-tagged wallets (vendor:
  Chainalysis / TRM Labs — out of repo).

## Until implemented

The current frontend does **not** geo-block. The compensating controls are:

- KYC required before contribution (`useKycVerification` gate in
  `ContributionForm.tsx`).
- Backend / contract whitelisting (out of this repo).
- A clear notice in Terms (`app/terms`) about who may participate.

## Trigger to revisit

- External counsel delivers the country list.
- A new jurisdiction (or a current one) issues guidance affecting the sale.
- Any change to the sale structure (security vs. utility classification).
