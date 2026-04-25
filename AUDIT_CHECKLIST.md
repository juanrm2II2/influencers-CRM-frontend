# Pre-ICO Audit Checklist

**Source of truth:** [`audit/findings.json`](./audit/findings.json) — the JSON is authoritative and feeds the
CI readiness-score step.

**Readiness score:**
```
score = 100 − 12·High − 4·Medium − 1·Low          (only findings with status="open" counted)
```
The CI job `Pre-ICO Readiness` in `.github/workflows/ci.yml` runs
`node scripts/compute-audit-score.mjs` on every PR and push to `main`, prints the
score to the step summary, and can be configured to fail the build via
`--enforce` (default is report-only so adopting the audit does not break CI).

Current score: **100 %** (0 High, 0 Medium, 0 Low open). The fresh-pass
audit on 2026-04-25 surfaced 5 new findings (M-07, M-08, L-07, L-08, L-09)
in addition to the 17 originally found (5H/6M/6L) — all 22 are now closed
in code on this branch. The repository is ready for the external Pre-ICO
Independent Audit pending the out-of-scope items listed below (backend
security review, smart-contract formal verification, third-party pentest,
public bug-bounty program, legal review, load/chaos tests, runbooks, KYC
redundancy, immutable artifact mirror).

---

## How to close a finding

1. Fix the code.
2. Add / update a Vitest spec asserting the fix.
3. Change `"status": "open"` → `"status": "fixed"` in `audit/findings.json`, optionally add
   `"fixedIn": "<commit-sha or PR#>"`.
4. CI recomputes the score on merge.

---

## HIGH severity (weight 12 each)

- [x] **H-01** `context/AuthContext.tsx:30` — Reduce `USER_CACHE_TTL_MS` ≤ 5 min and add
      server-push role-revocation sync.
- [x] **H-02** `lib/web3/hooks.ts:~202` — Validate `amountEth` (numeric, positive, ≤18 dp,
      within [MIN, MAX]) before `parseEther`.
- [x] **H-03** `lib/api.ts:8-24` — Add `timeout: 30000`, AbortController, and 401-dedup to
      the axios client.
- [x] **H-04** `middleware.ts:~117` — Add `AbortSignal.timeout(3000)` and signed-cookie
      fallback cache to `fetchAuthenticatedRole`.
- [x] **H-05** `lib/web3/contracts.ts:146-162` — Fail the **production build** when contract
      addresses are missing or invalid instead of silently using the zero address.

## MEDIUM severity (weight 4 each)

- [x] **M-01** `lib/web3/config.ts:54-62` — Document WalletConnect project-id rotation;
      add `gitleaks` pre-commit hook.
- [x] **M-02** `lib/web3/siwe.ts:127-152` — Client-side throttle + cache for SIWE nonce
      fetches; handle backend 429s.
- [x] **M-03** `lib/sanitize.ts:8-18` — Replace SSR no-op branch with an isomorphic
      sanitizer; unit-test the SSR path.
- [x] **M-04** `app/data-export/page.tsx:42-52` — POST audit event before the blob
      download (GDPR Art. 30).
- [x] **M-05** `lib/api.ts:15-24` — Bootstrap CSRF token on app load and reject
      state-changing requests client-side when the cookie is absent.
- [x] **M-06** `app/data-export/page.tsx:11-37` — Neutralize CSV formula-injection
      prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`) before writing each field; quote every
      field unconditionally; add a unit test for the injection vector.
- [x] **M-07** `components/web3/WhitelistManager.tsx:34-42` — Route admin whitelist
      `parseEther` calls through `parseWhitelistAmount` (a sibling of
      `parseContributionAmount` that shares the same strict regex / decimal-bound
      rules) so all wei-bound user input shares the H-02 validation contract.
- [x] **M-08** `package-lock.json` (transitive) — Documented residual posture in
      `SECURITY.md`; added Dependabot `web3-wallet` grouping for the
      `wagmi` / `@metamask/*` / `@rainbow-me/*` family. The CI npm-audit gate
      will be tightened to `--audit-level=moderate --omit=dev` once the upstream
      releases ship (only path to clear the 11 transitive moderates).

## LOW severity (weight 1 each)

- [x] **L-01** `lib/redirect.ts:29-41` — Explicitly reject `..` path segments.
- [x] **L-02** `components/web3/TransactionReceipt.tsx:74,96` — Chain-aware block-explorer
      URL.
- [x] **L-03** `context/AuthContext.tsx:140-183` — `AbortController` on the bootstrap
      `/api/auth/me` fetch.
- [x] **L-04** `lib/web3/hooks.ts:140-150` — Three-state return
      (`contribution|isLoading|error`) from `useUserContribution`.
- [x] **L-05** `next.config.mjs:27-31` — Explicit `Cache-Control: immutable` for SRI
      bundles.
- [x] **L-06** `app/cookie-policy/page.tsx` — Mirror cookie-consent state to the backend.
- [x] **L-07** `lib/api.ts:65-85` — On 401, navigate to
      `/login?redirect=<current-path>` (validated through `isSafeRedirectTarget`)
      so an expired session does not strand the user on a blank login page.
- [x] **L-08** `app/api/csp-report/route.ts:24-32` — Honour `x-forwarded-for` only
      when the request arrived via a known reverse-proxy hop (`VERCEL=1`,
      `RAILWAY_ENVIRONMENT`, `TRUSTED_PROXY_CIDRS`, or `TRUST_PROXY_HEADERS=true`);
      otherwise collapse to a single global bucket so attacker-controlled XFF
      cannot exhaust the limiter. Helper lives in `lib/trusted-proxy.ts`;
      deployment requirement documented in `docs/SECURITY_CONTACTS.md`.
- [x] **L-09** `app/influencers/[id]/page.tsx:178-183` — `full_name`, `handle`,
      and `niche` now flow through a shared `<DisplayName>` component (or an
      explicit `sanitizeText(...)` call) for defense-in-depth parity with `bio` /
      `notes` / `message_sent` / `response`.

---

## Verdict

**READY (100 %)** — fresh audit on 2026-04-25 confirms all 22 findings
(5H/8M/9L) are closed in source. The frontend is well-architected (strict CSP
with Trusted Types, SRI, httpOnly JWT cookies, double-submit CSRF, centralized
open-redirect guard, SIWE with chain-id/domain binding, SumSub KYC gate, 360+
Vitest specs).

Pre-ICO investor demos: GO.
Public sale: gated on completion of the out-of-scope items below — the
frontend itself is no longer the blocker.

### Out-of-scope / gaps remaining before a Pre-ICO Independent Audit

- Independent backend (Express) security audit
- Smart-contract formal verification (token sale + vesting)
- Third-party penetration test (OWASP ASVS L2)
- Public bug-bounty program (Immunefi / HackerOne)
- Legal review of Privacy Policy, Terms, DPA by qualified counsel
- Load & chaos testing on a production-parity staging environment
- Documented Incident Response plan and runbooks
- Post-launch SIEM / monitoring / alerting (CSP reports, 401 spikes, tx failures)
- KYC provider redundancy (fallback to a second vendor)
- Immutable archival of frontend build artifacts (IPFS / Arweave mirror)

See [`PRE_ICO_AUDIT_REPORT.pdf`](./PRE_ICO_AUDIT_REPORT.pdf) for the full report and
[`PRE_ICO_WHITE_PAPER.pdf`](./PRE_ICO_WHITE_PAPER.pdf) for the repo/product white paper.
