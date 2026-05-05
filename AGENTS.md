# AGENTS.md — F:\Programming

Instructions for AI coding agents operating anywhere under `F:\Programming\`.

## Before making ANY repo public (or shipping public binaries)

**READ FIRST:** [PUBLIC_RELEASE.md](PUBLIC_RELEASE.md)

These repos are private and intentionally commit `.env` files containing
MongoDB Atlas URIs and other secrets. Flipping a private repo to public,
or pushing pre-built binaries that bundle `.env`, will leak every committed
credential — including from history. Always publish to a brand-new public
repo and follow the checklist (strip `.env*`, add `.env.example`, refactor
hardcoded URIs, rotate credentials, secret-scan, then init fresh).

## Before pushing ANY commit to GitHub

**READ FIRST:** [GTPUSH.md](GTPUSH.md)

This machine has a misconfigured `GITHUB_TOKEN` environment variable that
silently breaks `git push` against any `github.com/teoperalez/*` repo with
a misleading 403 error. The fix is one line:

```powershell
Remove-Item Env:\GITHUB_TOKEN -ErrorAction SilentlyContinue
git push
```

Apply this in **every fresh terminal session** that pushes to GitHub, until
the user confirms the env var has been removed permanently from Windows
Environment Variables.

Additional gotchas covered in `GTPUSH.md`:

- A non-zero exit code from `git push` in PowerShell often does **not**
  indicate failure — inspect the output for `<old>..<new>  branch -> branch`.
- A 403 does **not** mean the repo is missing. Use a HEAD request to
  `https://github.com/<owner>/<repo>` to check existence before creating one.
- `gh repo create` works fine **after** `Remove-Item Env:\GITHUB_TOKEN` —
  `gh` then uses its keyring-stored OAuth token (full `repo` scope). No
  need to fall back to the GitHub web UI.

## General conventions for this workspace

- **Read the project README first.** When starting any new task inside a
  project folder, read that project's `README.md` (and any `AGENTS.md` /
  `CLAUDE.md` next to it) before editing or running anything. The README is
  the source of truth for installation, dev commands, build/release flow,
  data file locations, and platform-specific quirks. Do not guess setup
  steps when the README documents them.
- All projects live as **sibling folders** under `F:\Programming\`. Don't
  create nested project trees.
- Master prioritized backlog is at `TODO.md` — consult it when picking work
  and update statuses (`**Current Status:**`, `**Next Steps:**`) as items
  progress.
- Per-project conventions live in each subfolder's own `AGENTS.md`,
  `CLAUDE.md`, or `README.md` — read those before editing inside a project.
- Default OS is Windows + PowerShell 5.1. Prefer PowerShell-native commands
  over Unix utilities. Activate Python venvs with
  `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned;
  .\.venv\Scripts\Activate.ps1`.

## Cost-aware model delegation

To save on usage costs, delegate work to the cheapest model that can handle
it competently. Use the `runSubagent` tool with the `model` parameter to
route subtasks to a lower-cost model, and keep the top-tier model (the one
running the main conversation) reserved for planning, architecture, and
hard debugging.

Rough tiering — pick the lowest tier that fits:

- **Simple tasks** → `GPT-4o` or `Raptor Mini` (or similar small/fast
  models). Examples: file reads, single-file searches, renaming a
  variable, formatting fixes, listing matches, summarizing a README,
  trivial regex edits, boilerplate scaffolding.
- **Medium tasks** → `Sonnet 4.6` or `GPT 5.4`. Examples: implementing a
  well-specified function, multi-file refactors with a clear contract,
  writing tests for existing code, straightforward bug fixes, exploring
  an unfamiliar module.
- **Hard tasks** → keep on the main (top-tier) model. Examples: ambiguous
  requirements, cross-cutting architectural changes, subtle concurrency
  or perf bugs, security-sensitive code, anything touching credentials,
  release flow, or git history rewrites.

Guidelines:

- Prefer delegating **read-only exploration** (search, file reads,
  Q&A about the codebase) to a cheap model via the `Explore` agent.
- When delegating, give the subagent a **highly detailed, self-contained
  prompt** — it cannot ask follow-up questions and has no access to the
  main conversation history.
- Always specify exactly what the subagent should return (file paths,
  diffs, a summary, etc.) so its single reply is actionable.
- Do not delegate tasks involving secrets, public-release decisions, or
  destructive git operations — handle those on the main model per the
  sections above.
