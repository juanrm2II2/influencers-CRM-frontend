# Incident Response Plan

This plan covers security incidents affecting the Influencer CRM frontend and
the token-sale flow it serves. It is intentionally lightweight: where this repo
cannot enforce a control (paging, on-call rotation, status page, regulator
notification), the responsible **external entity** is named explicitly. See
[`SECURITY_CONTACTS.md`](./SECURITY_CONTACTS.md).

## Severity ladder

| Severity | Definition | Initial response | Comms cadence |
|---|---|---|---|
| **SEV-1 — Critical** | Active exploitation; user funds at risk; KYC/PII exfiltration in progress; signing key suspected compromised; wrong contract address served. | Page on-call within **15 min**. War-room within **30 min**. | Every 30 min. |
| **SEV-2 — High** | Significant security regression with no confirmed exploitation (e.g., CSP disabled, auth bypass in staging, vendor breach disclosure affecting us). | Page within **1 h**. | Every 2 h. |
| **SEV-3 — Medium** | Limited-scope vulnerability without active exploitation; degraded but not failed monitoring; vendor outage with workaround. | Acknowledge within **1 business day**. | Daily. |
| **SEV-4 — Low** | Hardening / hygiene issue; informational finding. | Tracked in `audit/findings.json`. | Per sprint. |

## Roles

| Role | Owner |
|---|---|
| **Incident Commander (IC)** | First responder; escalates if conflict of interest. |
| **Communications Lead** | Drafts user-facing comms (status page, email, social). Coordinates with Legal. |
| **Tech Lead** | Drives technical investigation and remediation. |
| **Legal/Compliance** | External counsel; mandatory consult for any SEV-1 with PII exposure or before any regulator notification. |
| **Scribe** | Captures timeline in the war-room channel; produces the post-mortem draft. |

The IC is **not** responsible for fixing the bug — only for orchestrating the
response. Splitting these roles is required for any SEV-1.

## Response phases

### 1. Detect

Sources we monitor (each must have a *named owner* in `SECURITY_CONTACTS.md`):

- Application errors (Sentry / equivalent) — frontend-emitted exceptions.
- CSP violation reports — endpoint defined in `lib/csp.ts` (`report-uri`).
- CI security checks (CodeQL, dependency-review, npm audit) on every PR.
- KYC vendor (SumSub) status feed.
- RPC provider (Alchemy / Infura) status feeds.
- Bug-bounty / responsible-disclosure inbox per `SECURITY.md`.
- Smart-contract event monitoring (out-of-repo: handled by the contract repo's
  monitoring stack).

### 2. Triage

Within the first 30 minutes the IC must answer, in writing, in the war-room:

1. What is the **blast radius**? (Users? Funds? PII? Reputation only?)
2. Is the issue **still progressing** or has it stopped?
3. What is the **fastest containment** option and its rollback cost?
4. What **regulatory clocks** start now? (GDPR: 72 h to supervisory authority
   for personal-data breaches. Securities-regulator timelines vary by
   jurisdiction — defer to external counsel.)

### 3. Contain

Frontend-side levers available **inside this repo**:

- Disable a route via `middleware.ts` to redirect to a maintenance page.
- Flip a feature flag (e.g., hide the contribution form) and redeploy.
- Force-rotate the CSRF / session cookies (backend coordination required).
- Revert the last deploy via the hosting provider (Vercel/Netlify/etc.).

Backend-side and contract-side levers (out of this repo, coordinate with their
owners):

- Pause the token-sale contract via the admin multisig.
- Revoke compromised JWTs / API keys.
- Rotate KYC webhook secrets.

### 4. Eradicate & Recover

- Land the fix on `main` with the smallest possible diff.
- Re-enable disabled paths.
- Verify with the runbook's "Confirm recovery" checklist (see `docs/runbooks/`).

### 5. Post-mortem

Required for every SEV-1 and SEV-2 within **5 business days**. Use the template
below. Post-mortems are **blameless** — they critique systems and decisions,
not individuals.

## Post-mortem template

```markdown
# Post-mortem: <one-line title> (SEV-<n>)

- **Date detected:** YYYY-MM-DD HH:MM UTC
- **Date resolved:** YYYY-MM-DD HH:MM UTC
- **Duration:** N hours M minutes
- **Author:** <name>
- **Status:** Draft / Reviewed / Final

## Summary
Two or three sentences. What happened, who was affected, what we did.

## Impact
- Users affected:
- Funds at risk / lost:
- PII exposed:
- Regulatory notifications required:

## Timeline (UTC)
- HH:MM — <event>
- HH:MM — <event>

## Root cause
What in our system made this possible? (Code, process, missing control.)

## What went well
## What went wrong
## Where we got lucky

## Action items
| ID | Owner | Due | Description | Tracking |
|---|---|---|---|---|
| AI-1 | @… | YYYY-MM-DD | … | #issue |
```

## Comms templates

User-facing copy must be reviewed by Legal and the Comms Lead before
publication. Drafts live in `docs/runbooks/comms-templates.md` (TODO — add
when first incident occurs or when Legal signs off on canned copy).

## Out-of-repo dependencies

These cannot be solved by changes in this repo and must be procured / staffed
separately:

- **Status page** (Statuspage, Instatus, Better Stack). Linked from the footer.
- **Pager** (PagerDuty, Opsgenie, Better Stack) with an on-call rotation.
- **SIEM / log retention** (Datadog, Grafana Cloud, Splunk).
- **Cyber-insurance carrier** with a breach-coach hotline.
- **Outside counsel** for breach notification (see `SECURITY_CONTACTS.md`).

## Runbooks

Step-by-step procedures live under [`runbooks/`](./runbooks/).
