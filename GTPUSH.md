# Git Push Issue on This Machine — READ BEFORE PUSHING

## TL;DR

Pushing to `github.com/teoperalez/*` repos from this machine fails with:

```
remote: Write access to repository not granted.
fatal: unable to access '...': The requested URL returned error: 403
```

**Cause:** A persistent environment variable `GITHUB_TOKEN` is set on this
machine to a classic PAT with **no scopes**. Git automatically uses it for
GitHub HTTPS auth and gets rejected.

**Workaround:** Unset `GITHUB_TOKEN` for the current shell before pushing.

---

## The fix (per terminal session)

```powershell
Remove-Item Env:\GITHUB_TOKEN -ErrorAction SilentlyContinue
git push
```

Git will then fall back to the Windows Credential Manager entry
(`Target: git:https://github.com`, `User: teoperalez`), which has the correct
permissions.

> Note: PowerShell may print the push result to **stderr** (progress lines)
> and exit with code `1` even on success. Look for a line like
> `abc1234..def5678  main -> main` — that means the push succeeded.

## Permanent fix (do this when you have time)

Pick **one** of these:

### Option A — Remove the bad env var entirely (recommended)

1. Press `Win + R`, run `sysdm.cpl`
2. Advanced tab → **Environment Variables**
3. Look for `GITHUB_TOKEN` in **both** the User variables and System variables lists
4. Delete it from wherever it appears
5. Restart any open terminals / VS Code

After this, no workaround is needed; git uses Credential Manager directly.

### Option B — Replace it with a properly scoped PAT

If you actually use `GITHUB_TOKEN` for some tool (e.g. a CLI that reads it):

1. Go to https://github.com/settings/personal-access-tokens
2. Find or create a token with `repo` (classic) or `Contents: read & write`
   (fine-grained) scope
3. Update the env var value in `sysdm.cpl` → Environment Variables

### Option C — Use SSH instead of HTTPS

```powershell
cd <repo>
git remote set-url origin git@github.com:teoperalez/<repo>.git
```

SSH bypasses the token entirely. Requires an SSH key registered at
https://github.com/settings/keys.

---

## How to verify the bad token is the problem

```powershell
$env:GITHUB_TOKEN          # If this prints "ghp_..." you have the issue
cmdkey /list:LegacyGeneric:target=git:https://github.com  # Should show user 'teoperalez'
```

If both show values, the env var is winning over Credential Manager — that's
the bug.

---

## Why this happens

Git for Windows' default credential helper (`manager-core` / GCM) checks
`GITHUB_TOKEN` and `GH_TOKEN` env vars **before** falling back to
Credential Manager storage. A token with no scopes still authenticates
successfully but is rejected on any write operation, producing the misleading
"Write access to repository not granted" error instead of "bad credentials".

The `gh` CLI exhibits the same behavior — `gh repo create` will fail with
a "scopes" error message that is at least more informative than git's.

**However:** once `GITHUB_TOKEN` is removed from the current shell,
`gh` falls back to its keyring-stored OAuth token (full `repo`, `gist`,
`read:org`, `workflow` scopes). That means `gh repo create`,
`gh repo view`, etc. all work fine after a single
`Remove-Item Env:\GITHUB_TOKEN` — no need to create repos via the web UI.

```powershell
Remove-Item Env:\GITHUB_TOKEN -ErrorAction SilentlyContinue
gh auth status      # should show "Logged in to github.com (keyring)"
gh repo create teoperalez/<name> --private --source=. --remote=origin
git push -u origin main
```

---

## Notes for AI agents

- **Never assume a 403 means the repo doesn't exist.** Check
  `https://github.com/<owner>/<repo>` first (e.g. `Invoke-WebRequest -Method Head`).
- **Always run `Remove-Item Env:\GITHUB_TOKEN` before any `git push` in
  fresh terminals** until the user confirms they've removed the env var
  permanently.
- The Windows Credential Manager entry under `git:https://github.com` (user
  `teoperalez`) has the correct permissions and is what you want git to use.
- A non-zero exit code from `git push` in PowerShell does **not** reliably
  indicate failure. Inspect the output for the `<old>..<new>  <branch> -> <branch>`
  line.
