# Runbook — Suspected key / secret compromise

**Trigger:** Any of the following:

- A deploy key, GitHub PAT, or CI secret may have been exposed (logs, paste
  bin, public commit).
- A vendor (Sumsub, RPC provider, hosting) reports a breach affecting our
  account.
- A multisig signer reports lost or compromised key material.
- Unusual git history rewrites or unauthorized commits to `main`.

**Default severity:** **SEV-1** for any signer key, deploy key, or production
secret. **SEV-2** for non-production / read-only secrets.

> ⚠️ This runbook covers the *frontend / repo* side. Smart-contract signer
> compromise is owned by the contract / treasury runbook in the multisig
> repository — this runbook only covers the steps **this repo** can take.

## Containment (in this order)

1. **Rotate the suspected secret immediately.** Do not wait for
   investigation. Specifically:
   - GitHub repo: revoke deploy keys, PATs, and OAuth apps with write access.
     Force-rotate any Actions secrets (`Settings → Secrets and variables →
     Actions`).
   - Hosting provider (Vercel/etc.): rotate deployment hooks, build env vars
     containing secrets.
   - Vendor APIs: rotate keys at the vendor (SumSub admin, RPC dashboard).
   - WalletConnect / project IDs: rotate via the WalletConnect cloud console.
2. **Freeze deployments** until rotation is complete (disable the deploy
   workflow or pause auto-deploys in the hosting provider).
3. If a signer key is involved, **trigger the contract pause** via the
   remaining healthy signers. (Out of this repo — coordinate with the
   contract team per `SECURITY_CONTACTS.md`.)
4. **Preserve evidence.** Do not force-push or rewrite history that may be
   needed for investigation. Take a tarball snapshot of the repo and CI logs.

## Investigation

1. Audit recent activity:
   - GitHub audit log (Org → Settings → Audit log).
   - Hosting provider deployment log.
   - Vendor access logs (KYC, RPC, WalletConnect).
2. Determine **window of exposure**: when was the secret created vs. when was
   the rotation complete?
3. Determine **what could the attacker have done in that window**:
   - Pushed code? → diff `main` against last-known-good signed tag.
   - Deployed a build? → check production HTML/JS for tampering.
   - Read user data? → backend / vendor logs (out of repo).

## Recovery

1. Reset the attack surface:
   - Re-issue rotated secrets to all systems that need them.
   - Re-enable deployments only after a clean, verified build from a known-good
     commit.
2. Verify production matches `main` (compare HTML/JS hashes against a clean
   local build).
3. Re-enable any paused contracts only after the contract team's recovery
   runbook completes.

## Confirm recovery

- [ ] All rotated secrets confirmed working in production.
- [ ] Production build hash matches a fresh, locally verified build of the
      known-good commit.
- [ ] Audit logs show no further use of the old secrets after rotation
      timestamp.
- [ ] Contract un-paused (if applicable).

## Follow-ups

- Enable / verify branch protection on `main` (required reviews, signed
  commits, no force-push, no deletion).
- Enable GitHub secret scanning + push protection if not already on.
- Consider OIDC-based deploys instead of long-lived secrets where possible.
- Insurance carrier notification (see `SECURITY_CONTACTS.md`).
- Regulator notification if PII was exposed (timer started at *awareness*, not
  containment — defer to counsel).
