# Runbooks

Step-by-step procedures for the highest-likelihood incidents affecting this
frontend. Each runbook follows the same structure:

1. **Trigger** — what alert / signal kicks it off.
2. **Severity** — default SEV; the IC may override.
3. **Containment** — fastest action to stop ongoing harm.
4. **Investigation** — what to check and where.
5. **Recovery** — how to safely re-enable.
6. **Confirm recovery** — explicit checks, not "looks good".
7. **Follow-ups** — items for the post-mortem action list.

| Runbook | Scenario |
|---|---|
| [`wrong-chain-deploy.md`](./wrong-chain-deploy.md) | Production build deployed pointing at wrong contract address or chain id. |
| [`csp-violation-spike.md`](./csp-violation-spike.md) | Surge of CSP violation reports — possible XSS or upstream dependency change. |
| [`kyc-vendor-outage.md`](./kyc-vendor-outage.md) | SumSub WebSDK or API down; new contributors blocked. |
| [`rpc-degraded.md`](./rpc-degraded.md) | RPC provider slow / returning stale data. |
| [`tx-failure-spike.md`](./tx-failure-spike.md) | Contribution transactions failing at unusual rates. |
| [`hard-cap-approaching.md`](./hard-cap-approaching.md) | Token-sale near hard-cap; UI must reflect closure cleanly. |
| [`key-compromise.md`](./key-compromise.md) | Suspected compromise of a deploy key, signer key, or vendor secret. |
| [`geo-restriction.md`](./geo-restriction.md) | Planned control: jurisdictional access restriction (legal sign-off required). |
