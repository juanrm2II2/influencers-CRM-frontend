# Threat Model — Influencer CRM Frontend

This is a STRIDE threat model focused on what *this repository* contributes to
the overall security posture. Smart-contract and backend threats are out of
scope here and must be modelled in their own repositories.

STRIDE = **S**poofing · **T**ampering · **R**epudiation · **I**nformation
disclosure · **D**enial of service · **E**levation of privilege.

## System overview

```
Browser ──▶ Next.js frontend (this repo) ──▶ Express/Supabase backend ──▶ DB
                  │                                  │
                  ├──▶ WalletConnect / RPC           ├──▶ SumSub (KYC)
                  └──▶ Token-sale & Vesting          └──▶ Sentry / SIEM
                       smart contracts (chain)
```

Trust boundaries crossed by this repo:

1. **Browser ↔ Frontend origin** — protected by HTTPS, HSTS, CSP, CSRF.
2. **Frontend ↔ Backend** — Axios with `withCredentials`, double-submit CSRF cookie.
3. **Frontend ↔ Wallet (extension/WalletConnect)** — chain-id assertion before any tx.
4. **Frontend ↔ KYC iframe (SumSub)** — frame-src restricted in CSP.
5. **Frontend ↔ Token-sale contract** — address pinned via env var; chain-id pinned.

## Assets

| Asset | Where it lives in this repo | Sensitivity |
|---|---|---|
| Authenticated user session | httpOnly cookies (set by backend) | High |
| User profile cache | `sessionStorage` (UI rehydration only) | Low |
| CSRF token (`XSRF-TOKEN`) | non-httpOnly cookie + header | Medium |
| Token-sale contract address | `NEXT_PUBLIC_TOKEN_SALE_ADDRESS` (build-time) | **Critical** |
| Vesting contract address | `NEXT_PUBLIC_VESTING_ADDRESS` (build-time) | **Critical** |
| Expected chain id | `NEXT_PUBLIC_EXPECTED_CHAIN_ID` (`lib/web3/config.ts`) | High |
| WalletConnect project id | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Low (public by design) |
| KYC applicant access token | Fetched per session via backend proxy (`lib/kyc.ts`) | High |
| Open-redirect allow-list | `lib/redirect.ts` | Medium |
| CSP policy | `lib/csp.ts` (single source of truth) | High |
| Build-time env validation | `next.config.mjs`, `lib/config.ts` | High |

## STRIDE — per asset

### Authenticated session cookie

- **S/E** Account takeover via stolen cookie. **Mitigations:** httpOnly + Secure + SameSite (set by backend); short TTL on user profile cache (see audit finding H-01); CSP `frame-ancestors 'none'` blocks clickjacking-based session abuse.
- **T** CSRF on state-changing requests. **Mitigations:** Double-submit cookie via `lib/csrf.ts`; `SameSite=Lax` defence-in-depth.
- **R** No client-side audit log; repudiation handled server-side.

### Token-sale contract address (Critical)

- **T** Build-time substitution of `NEXT_PUBLIC_TOKEN_SALE_ADDRESS` would route every contribution to an attacker. **Mitigations:** environment variable validated at build (`next.config.mjs`); CI uses fixed allow-listed values; production deploy reviewed; `EXPECTED_CHAIN_ID` guard in `lib/web3/hooks.ts` prevents wrong-chain submission. **Residual:** supply-chain compromise of the build pipeline — see runbook `wrong-chain-deploy.md`. Defense in depth requires a smart-contract pause + multisig (out of scope here).
- **I** Address is public anyway; no confidentiality concern.
- **D** Address misconfigured to a non-existent contract — wallet rejects tx; user-impacting but funds-safe.

### KYC flow (SumSub)

- **S** Bypass of KYC gate to contribute. **Mitigations:** `useKycVerification` server-truth check in `components/web3/ContributionForm.tsx`; backend re-validates on every contribution submission (out of repo).
- **I** Applicant data exposure via DOM. **Mitigations:** SumSub WebSDK runs in a sandboxed iframe; CSP `frame-src` allow-lists only `*.sumsub.com`.
- **T** XSS injecting a fake KYC iframe. **Mitigations:** strict CSP (`script-src 'self'`, `require-trusted-types-for 'script'`, no inline scripts).

### Open-redirect on `?redirect=`

- **S/T** Phishing via crafted `redirect` parameter. **Mitigations:** `isSafeRedirectTarget` / `sanitizeRedirectTarget` in `lib/redirect.ts`, applied in middleware and login page. Continue to add fuzz tests when adding new entry points.

### CSP and headers

- **T** Header drift between Next.js config and middleware. **Mitigations:** single source of truth in `lib/csp.ts`; CSP report endpoint live (`report-uri`) for runtime detection.
- **D** Adversary spamming the CSP report endpoint to cost us money. **Mitigations:** rate limiter (`lib/csp-rate-limiter.ts`).

### Wallet / RPC

- **S** Malicious dApp tricking the user into signing on the wrong chain. **Mitigations:** `EXPECTED_CHAIN_ID` enforced in every write hook (`lib/web3/hooks.ts`).
- **T** RPC provider returning a forked / lying view. **Mitigations:** Wallet's own balance check on submit; user-visible chain id; out-of-repo: subscribe to provider status (see `runbooks/rpc-degraded.md`).
- **D** WalletConnect relay outage. **Mitigations:** runbook + multiple wallet connectors enabled.

## Threats explicitly out of this repo's scope

- Smart-contract logic flaws (re-entrancy, integer overflow, access control).
- Backend authn/z, rate-limiting, JWT signing-key management.
- Sanctioned-jurisdiction enforcement (legal call — see `runbooks/geo-restriction.md`).
- DDoS at the edge (CDN/WAF concern).
- Insider threat / signer key compromise (multisig + custody concern).

## Review cadence

Re-run this exercise:

- Before every major release.
- Whenever a new third-party integration is added.
- After any SEV-1 or SEV-2 incident, as part of the post-mortem.
