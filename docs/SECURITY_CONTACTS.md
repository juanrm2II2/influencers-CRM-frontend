# Security Contacts

This file tracks the **third-party entities** required for a complete security
posture but that cannot be substituted by code in this repository. Treat this
as a TODO list for procurement; replace `TBD` entries before launch.

> ⚠️ This document contains contact information for sensitive functions.
> Do **not** add personal phone numbers or home addresses. Use role-based
> emails and 24/7 hotline numbers provided by the vendors.

## Internal roles

| Role | Person | 24/7 contact | Backup |
|---|---|---|---|
| Incident Commander (primary) | TBD | TBD | TBD |
| Tech Lead (frontend) | TBD | TBD | TBD |
| Tech Lead (backend) | TBD | TBD | TBD |
| Tech Lead (contracts) | TBD | TBD | TBD |
| Communications Lead | TBD | TBD | TBD |
| Legal liaison | TBD | TBD | TBD |

## External vendors

### Pentest / audit firm

- **Vendor:** TBD (e.g., Trail of Bits, NCC Group, Cure53, Doyensec, Halborn,
  CertiK, OpenZeppelin)
- **Engagement type:** Fixed-scope ASVS L2 application pentest + smart-contract audit
- **Re-test window:** TBD weeks after fixes shipped
- **Report due:** Before mainnet deployment
- **Contract on file:** TBD (link to signed SOW)

### Bug-bounty platform

- **Web3 scope (contracts + integration):** Immunefi (recommended) — TBD
- **Application scope:** HackerOne or Bugcrowd — TBD
- **Pool size:** TBD (Immunefi typical range $50k–$1M+ for a token sale)
- **Triager:** Platform-managed
- **Public program URL:** TBD

### Smart-contract auditor

(Separate from application pentest.)

- **Vendor:** TBD
- **Audit reports:** Linked from `PRE_ICO_AUDIT_REPORT.pdf` and the contract repo
- **Re-audit on contract change:** Required

### Legal counsel

- **Securities / token classification:** TBD law firm (jurisdiction-specific)
- **Privacy / GDPR & CCPA:** TBD
- **Sanctions / OFAC / sanctioned-jurisdictions list:** TBD
- **Breach-notification advisor:** TBD (often the cyber-insurance breach coach)

### KYC / AML provider

- **Primary:** SumSub (already integrated — see `lib/kyc.ts`)
- **Vendor security contact:** `security@sumsub.com` (verify on their site)
- **DPA on file:** TBD
- **Status page:** https://status.sumsub.com

### RPC / Web3 infrastructure

- **Primary RPC:** TBD (Alchemy / Infura)
- **Status page:** https://status.alchemy.com / https://status.infura.io
- **WalletConnect:** https://walletconnect.com (status: https://status.walletconnect.com)

### Hosting / CDN / WAF

- **Primary hosting:** TBD (Vercel / Cloudflare Pages / AWS Amplify)
- **DNS:** TBD
- **WAF:** TBD
- **Status page:** TBD

### Monitoring / SIEM

- **Error tracking:** TBD (Sentry / Datadog / Honeybadger)
- **Logs / SIEM:** TBD
- **CSP report sink:** Currently `/api/csp-report` (`lib/csp.ts`). External
  collector TBD.
- **Status page (ours):** TBD (Statuspage / Instatus / Better Stack)
- **Pager:** TBD (PagerDuty / Opsgenie / Better Stack)

### Multisig & custody (token-sale)

- **Multisig type:** TBD (Safe / Squads / etc.)
- **Signer roster:** TBD (≥ N-of-M; geographically distributed; see runbook
  `key-compromise.md`)
- **Custody for raised funds:** TBD (Anchorage, Fireblocks, BitGo, or
  self-custody multisig)
- **Treasury policy:** TBD (link to internal doc)

### Cyber-insurance

- **Carrier:** TBD
- **Policy number:** TBD (store in 1Password / vault, not here)
- **Breach-coach hotline:** TBD
- **Coverage limit & deductible:** TBD

### Other regulators / authorities

(Populate per jurisdiction once counsel confirms applicability.)

| Authority | Notification deadline | Contact |
|---|---|---|
| Lead GDPR supervisory authority | 72 hours from awareness | TBD |
| Local securities regulator | TBD | TBD |
| Local data-protection authority (CCPA/UK ICO/etc.) | TBD | TBD |

## Deployment trust boundaries

The `/api/csp-report` rate limiter (and any other endpoint that keys on a
client IP) only honours `x-forwarded-for` / `x-real-ip` when the deployment
is configured as being behind a trusted reverse proxy — see
[`lib/trusted-proxy.ts`](../lib/trusted-proxy.ts) and audit finding L-08.

| Topology | Required configuration |
|---|---|
| Vercel | Automatic — `VERCEL=1` is set by the platform. Headers are platform-signed. |
| Railway | Automatic — `RAILWAY_ENVIRONMENT` is set by the platform. |
| Self-hosted behind a known-good proxy (nginx / Caddy / Cloudflare) | Set `TRUSTED_PROXY_CIDRS=<list-of-CIDRs>` **or** `TRUST_PROXY_HEADERS=true`. Document the proxy + IP allow-list here. |
| Direct-to-origin (no proxy) | Leave both unset. The limiter collapses to a single global bucket — attacker-controlled XFF cannot exhaust the in-memory store, but legitimate users share the 10/min ceiling. Acceptable for low-traffic deployments only. |

Record the live production topology + the CIDR list (or proxy provider) in
the row below so an external auditor can verify the trust boundary:

| Environment | Proxy in front of origin | Trust opt-in mechanism | Last verified |
|---|---|---|---|
| `production` | TBD | TBD | TBD |
| `staging` | TBD | TBD | TBD |

## Updating this file

- Review **quarterly** and after any vendor change.
- Removing or changing a 24/7 contact requires a PR review by the Incident
  Commander.
- Never commit phone numbers, API keys, or shared secrets to this file.
  Reference the secret store (1Password / Vault) instead.
