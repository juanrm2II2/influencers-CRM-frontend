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

Current score at time of audit: **10 %** (5 High + 6 Medium + 6 Low open).
Score after this remediation pass: **100 %** (all 17 findings fixed; see commit history
on `copilot/fix-audit-issues`).

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

---

## Verdict

**CONDITIONALLY READY** — the frontend is well-architected (strict CSP with Trusted
Types, SRI, httpOnly JWT cookies, double-submit CSRF, centralized open-redirect guard,
SIWE with chain-id/domain binding, SumSub KYC gate, 260+ Vitest specs). The five High
findings are hardening items rather than directly exploitable vulnerabilities and are
closable within 1–2 sprints. The only directly exploitable issue is M-06 (CSV
formula-injection in the GDPR data-export path) and it is a one-file fix.

Pre-ICO investor demos: OK.
Public sale: block until all HIGH are closed **and** the out-of-scope items below
complete.

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
