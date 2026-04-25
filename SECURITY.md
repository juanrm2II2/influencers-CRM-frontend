# Security Policy

We take the security of the Influencer CRM frontend and the associated token-sale
flow seriously. Thank you for helping keep our users and contributors safe.

## Supported versions

Only the `main` branch and the currently deployed production build are in scope
for security fixes. Older tagged releases are **not** patched.

## Reporting a vulnerability

**Please do not open public GitHub issues, pull requests, or discussions for
security reports.** Use one of the private channels below.

| Channel | Address |
|---|---|
| Email (preferred) | `security@<your-domain>` |
| Encrypted email | Use the PGP key fingerprint published at `/.well-known/security.txt` |
| GitHub Private Vulnerability Reporting | https://github.com/juanrm2II2/influencers-CRM-frontend/security/advisories/new |

Please include:

1. A clear description of the issue and its impact.
2. Steps to reproduce (PoC, request/response pairs, or a minimal repository).
3. The commit SHA or deployed URL you tested against.
4. Your name / handle for credit (optional).

We aim to:

- Acknowledge your report within **2 business days**.
- Provide a triage decision (accepted / duplicate / out-of-scope) within **7 days**.
- Ship a fix or mitigation for accepted **High/Critical** issues within **30 days**,
  and Medium issues within **90 days**.

## Scope

**In scope**

- This repository's frontend code (Next.js App Router app under `app/`, `lib/`,
  `components/`, `middleware.ts`, build/CI configuration).
- The deployed production frontend.
- The CSP, security headers, CSRF, and authentication flows defined here.
- Web3 contribution and KYC-gating UI logic in `components/web3/` and `lib/web3/`.

**Out of scope**

- The Express/Supabase backend (separate repository — report there).
- Smart contracts (token sale, vesting) — report to the contract repository.
- Third-party providers we depend on (WalletConnect, Alchemy, Infura, SumSub,
  Sentry). Report directly to those vendors.
- Findings that require physical access, social engineering of staff, or
  denial-of-service via volumetric traffic.
- Reports generated solely by automated scanners with no demonstrated impact.
- Best-practice / informational findings without a concrete exploit path
  (missing headers on non-sensitive endpoints, version disclosure on public
  static assets, etc.).

## Safe harbor

We will not pursue legal action or law-enforcement investigation against
researchers who:

- Make a good-faith effort to avoid privacy violations, destruction of data,
  and interruption or degradation of service.
- Only test against accounts they own or have explicit permission to test.
- Do **not** access, modify, or exfiltrate user data beyond the minimum needed
  to demonstrate the vulnerability.
- Do **not** publicly disclose the issue before it is fixed and we have
  authorized disclosure.
- Comply with all applicable laws.

This safe-harbor language is provided for clarity and does not by itself create
a legal contract; the formal program terms (once a bug-bounty platform is
engaged — see `docs/SECURITY_CONTACTS.md`) will govern.

## Bug bounty

A formal bug-bounty program is **not yet active**. Once engaged with a bounty
platform (Immunefi for Web3 scope, HackerOne / Bugcrowd for application scope),
this section will be updated with the program URL and reward table. Until then,
all valid reports will be acknowledged in `SECURITY_ACKNOWLEDGEMENTS.md` (with
your permission) and may be eligible for discretionary rewards.

## Coordinated disclosure

We follow a 90-day coordinated-disclosure window for High/Critical issues,
extendable by mutual agreement when a fix is materially in progress. Lower
severity issues default to public disclosure on fix.

## Related documents

- [`docs/INCIDENT_RESPONSE.md`](docs/INCIDENT_RESPONSE.md) — how we respond once a report is accepted.
- [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) — assets, trust boundaries, and the threats we already track.
- [`docs/SECURITY_CONTACTS.md`](docs/SECURITY_CONTACTS.md) — third parties involved in our security posture.
- [`audit/findings.json`](audit/findings.json) — current audit findings & status.
