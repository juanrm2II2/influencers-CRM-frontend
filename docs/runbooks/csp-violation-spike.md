# Runbook — CSP violation spike

**Trigger:** Sustained surge in reports posted to the CSP `report-uri`
(`/api/csp-report`, defined in `lib/csp.ts`) above the baseline rate.

**Default severity:** **SEV-2** if violations come from production and
suggest script injection; **SEV-3** if they correlate with a known dependency
update or browser-extension noise.

## Containment

1. **Do not relax the CSP** as a first response. A sudden flood usually means
   the policy is *working*.
2. If a single hostile script source is dominant, add it explicitly to the
   `report-only` deny telemetry so it's clearly tracked. Do **not** add it to
   any allow-list.
3. If the violations correlate with a recent deploy, **roll back** to the
   previous build.

## Investigation

1. Pull recent reports from the CSP sink. Group by:
   - `violated-directive`
   - `blocked-uri`
   - `source-file` and `line-number`
   - User agent (browser-extension noise vs. real attack)
2. Cross-check against:
   - Recent merges to `lib/csp.ts` and `next.config.mjs`.
   - Recent dependency bumps (`package.json` / Dependabot PRs) that may have
     introduced a new origin.
   - CDN / image-host rotation (e.g., a Twitter/Instagram image domain
     changing).
3. Differentiate **same-origin** violations (likely real bug or attack) from
   **cross-origin extension noise** (`chrome-extension://`, `moz-extension://`,
   data URIs from translation extensions). Extension noise is informational.

## Recovery

- If a legitimate new origin is needed, add it to **`lib/csp.ts` only** —
  never inline-edit `middleware.ts` or `next.config.mjs`. The single source of
  truth invariant must be preserved.
- Land a unit test exercising the new directive shape if the CSP construction
  logic changes.

## Confirm recovery

- [ ] CSP report rate returns to baseline.
- [ ] No `script-src` / `script-src-elem` violations from same-origin pages
      remain.
- [ ] CSP header is identical when fetched via curl from the production URL
      and via the middleware path (no drift).

## Follow-ups

- If extension noise is persistent, add server-side filtering at the CSP sink
  before alerting on volume.
- Consider switching to `Content-Security-Policy-Report-Only` for staged
  rollouts of new directives.
- Tune rate limiter (`lib/csp-rate-limiter.ts`) if the surge indicates abuse.
