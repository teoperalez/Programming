# Public Release Checklist

Read this **before** making any project under `F:\Programming\` public, or
before publishing pre-built binaries (installers, DMGs, ZIPs) of any of these
projects to the internet.

> **TL;DR** — these repos are currently **private** and intentionally commit
> their `.env` files (with MongoDB Atlas URIs, API tokens, etc.) so credentials
> sync across machines. The moment a repo (or a build of it) goes public, every
> committed secret is **compromised** — both in `HEAD` *and* in the entire git
> history.

## 1. Never flip a private repo to public

The "Change visibility → Public" button on GitHub does **not** scrub history.
Every secret you ever committed is still there in old commits and forks.

If you want a public version of a project, **always** publish it as a
**brand-new public repository**, not by toggling the existing private one.

## 2. Workflow for releasing a project publicly

For each project you want to release publicly (e.g. `RBYNewLayout`,
`GSCNewLayout`, `RSENewLayout`, `RBYPC2025`, etc.):

1. **Create a new, empty public repo** on GitHub
   (e.g. `RBYNewLayout-public`). Do **not** import history.
2. In a fresh working copy of the project, delete the entire `.git/` folder so
   you start with no history.
3. **Remove every `.env*` file** from the working tree:
   ```powershell
   Get-ChildItem -Force -Recurse -Filter '.env*' |
     Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
     Remove-Item -Force
   ```
4. **Add `.env` to `.gitignore`** and commit a `.env.example` instead with
   placeholder values:
   ```
   # .gitignore
   .env
   .env.*
   !.env.example
   ```
   ```
   # .env.example
   DATABASE_URL="mongodb+srv://<user>:<pass>@<cluster>/<db>?..."
   GSC_RSE_DATABASE_URL="mongodb+srv://<user>:<pass>@<cluster>/<db>?..."
   ```
5. **Audit for other secrets** before the first public commit. Run a quick
   scan from the project root:
   ```powershell
   Select-String -Path . -Recurse -Pattern 'mongodb\+srv|sk_live|ghp_|xoxb-|AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----' -List `
     -Exclude *.png,*.jpg,*.jpeg,*.gif,*.webp,*.mp3,*.mp4,*.wav,*.zip,*.dll,*.node,*.exe,*.dmg `
     | Where-Object { $_.Path -notmatch '\\node_modules\\|\\dist\\|\\build\\|\\\.git\\' }
   ```
   Inspect every match. Anything that looks like a real key, token, or
   connection string must be moved into `.env` and replaced with
   `process.env.X` (or the language equivalent) **before** you commit.
6. **Audit hardcoded credentials in source.** Search for any string starting
   with `mongodb+srv://`, `https://...@`, or known API prefixes that may have
   been pasted directly into JS/TS/Python files instead of being read from
   env. Refactor them to read from `process.env.*`.
7. **Rotate any credentials that ever lived in the private repo's history.**
   Even if you do everything else perfectly, a private repo's secrets should
   be considered "moderately exposed" (anyone with read access at any point
   could have pulled them). Before publishing the *public* sibling repo:
   - Generate a new MongoDB Atlas database user / password and revoke the old
     one once all clients are updated.
   - Rotate any GitHub PATs, Discord bot tokens, OBS WebSocket passwords,
     OAuth client secrets, etc.
8. **Initialize git fresh and push to the new public remote:**
   ```powershell
   git init
   git checkout -b main
   git add -A
   git commit -m "Initial public release"
   git remote add origin https://github.com/<owner>/<project>-public.git
   git push -u origin main
   ```
9. **Verify on github.com** that no `.env`, no `*.key`, no
   `node_modules/.prisma/.../*-engine-*.node` blob, and no oversized media
   accidentally got pushed.
10. **For pre-built binaries** (electron-builder DMG / NSIS installer / ZIP),
    confirm the build does **not** bundle `.env`. The `extraResources` /
    `asarUnpack` blocks in `package.json` should only ship code and the Prisma
    engine, never the `.env` file. Test by extracting the installed app and
    grepping for known secret fragments.

## 3. If you accidentally committed a secret to a public repo

Treat the secret as **fully compromised**, immediately:

1. **Rotate the credential** at the source (MongoDB Atlas, GitHub, Discord,
   etc.). Do this **before** removing it from history — bots scrape new
   public commits within seconds.
2. Remove the secret from the current working tree, commit, push.
3. Optionally rewrite history with `git filter-repo` (or BFG) to scrub the
   secret from old commits, then `git push --force`. This is **not** a
   substitute for rotating — assume any commit that was ever public has been
   archived by third parties.
4. Force every collaborator to re-clone after the force-push.

## 4. Project-specific notes

- **RBYNewLayout / GSCNewLayout / RSENewLayout** — all three load env vars via
  `dotenv` and reference `DATABASE_URL` (Prisma → MongoDB Atlas) and, for the
  cross-project channel-EXP feature, `GSC_RSE_DATABASE_URL` /
  `RBY_DATABASE_URL`. Strip both before public release.
- **Discord Bot** — uses Prisma + a Discord bot token. The token must be
  rotated through the Discord Developer Portal as part of any public release.
- **PokerSolver / pokemon-exp-calculator / TeoPeralez.com** — currently no
  secrets known to be committed, but re-run the audit in step 5 anyway before
  flipping any of them public.

## 5. Why we keep `.env` committed in private repos

Convenience: a fresh clone on a new machine is immediately runnable, no
out-of-band credential transfer needed. This is **only acceptable** while
every collaborator on the repo is trusted with those credentials and the
repo is private. The instant either of those changes, follow this document.
