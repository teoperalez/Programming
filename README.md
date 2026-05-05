# Programming — workspace meta-repo

This repo tracks the **shape** of `F:\Programming\` (the conventions doc,
the master TODO, and a manifest of every sibling project + its GitHub
remote) so that a fresh machine can be bootstrapped with a single command.

It does **not** contain any project source code — each project lives in
its own private repo under `github.com/teoperalez/*` and is cloned into a
sibling folder by the bootstrap script.

## What's in here

| File | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Workspace-wide instructions for AI coding agents. |
| [GTPUSH.md](GTPUSH.md) | Workaround for the misconfigured `GITHUB_TOKEN` env var on this machine. |
| [PUBLIC_RELEASE.md](PUBLIC_RELEASE.md) | Checklist before flipping any repo public. |
| [TODO.md](TODO.md) | Master prioritized backlog across all projects. |
| [repos.json](repos.json) | Manifest of every project folder, GitHub remote, and default branch. |
| [bootstrap.ps1](bootstrap.ps1) | Windows/PowerShell clone-everything script. |
| [bootstrap.sh](bootstrap.sh) | macOS/Linux clone-everything script (needs `jq`). |

## Bootstrapping a new machine

### Windows / PowerShell

```powershell
# 1. Pick a root folder and clone the meta-repo into it
git clone https://github.com/teoperalez/Programming.git F:\Programming
cd F:\Programming

# 2. Make sure git auth works (see GTPUSH.md)
Remove-Item Env:\GITHUB_TOKEN -ErrorAction SilentlyContinue
gh auth status   # must show "Logged in to github.com"

# 3. Clone every project listed in repos.json
pwsh .\bootstrap.ps1

# Optional flags
pwsh .\bootstrap.ps1 -UseSsh           # rewrite remotes to git@github.com
pwsh .\bootstrap.ps1 -SkipExisting     # don't touch already-cloned folders
pwsh .\bootstrap.ps1 -Root D:\Code     # clone into a different root
```

### macOS / Linux

```bash
git clone https://github.com/teoperalez/Programming.git ~/Programming
cd ~/Programming
brew install jq            # or: sudo apt install jq
./bootstrap.sh

# Optional env vars
USE_SSH=1 ./bootstrap.sh
SKIP_EXISTING=1 ./bootstrap.sh
ROOT=~/code ./bootstrap.sh
```

The script is **idempotent**: re-running it on an existing checkout will
`git fetch --all --prune`, check out the manifest's branch, and
`git pull --ff-only` instead of re-cloning.

## Maintaining `repos.json`

When you add a new project under `F:\Programming\`:

1. Create the GitHub repo as usual (e.g. `gh repo create teoperalez/<name> --private --source=. --remote=origin --push`).
2. Add an entry to the `repos` array in [repos.json](repos.json):
   ```json
   { "folder": "<folder-name>", "remote": "https://github.com/teoperalez/<name>.git", "branch": "main" }
   ```
3. Commit + push this meta-repo.

If a project should **not** be cloned automatically (huge runtime, vendored
binaries, intentionally local-only), add it to the `skipped` array with a
`reason` so future-you remembers why.

## What is intentionally not tracked here

The repo's [.gitignore](.gitignore) excludes every project sibling folder
by default — so you can edit `AGENTS.md`, `TODO.md`, or the manifest
without `git status` getting drowned in unrelated changes. The only paths
that get committed are the docs and scripts listed in the table above.
