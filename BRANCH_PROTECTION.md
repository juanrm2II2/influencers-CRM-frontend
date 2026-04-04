# Branch Protection Rules

This document describes the recommended branch protection configuration for the `main` and `develop` branches.

## Recommended Settings

Apply these rules in **Settings → Branches → Branch protection rules** for `main` (and optionally `develop`).

### Required Status Checks

Enable **Require status checks to pass before merging** and add the following required checks:

| Check Name       | Description                        |
| ---------------- | ---------------------------------- |
| `Lint`           | ESLint passes with no errors       |
| `Type Check`     | TypeScript compiles with no errors |
| `Test`           | All Vitest tests pass              |
| `Build`          | Next.js production build succeeds  |
| `Security Audit` | No high/critical npm vulnerabilities |

Enable **Require branches to be up to date before merging** so that status checks run against the latest base branch.

### Pull Request Reviews

- **Require a pull request before merging** — enabled
- **Required number of approvals** — at least 1
- **Dismiss stale pull request approvals when new commits are pushed** — enabled

### Additional Protections

- **Require signed commits** — recommended
- **Require linear history** — recommended (enforces squash or rebase merges)
- **Do not allow bypassing the above settings** — enabled for all users, including administrators
- **Restrict who can push to matching branches** — limit direct pushes to release automation only

## How to Apply

1. Go to the repository **Settings → Branches**.
2. Click **Add rule** (or edit an existing rule).
3. Set **Branch name pattern** to `main`.
4. Configure the settings listed above.
5. Click **Create** / **Save changes**.
6. Repeat for `develop` if desired.
