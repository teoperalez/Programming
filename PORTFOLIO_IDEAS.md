# PORTFOLIO_IDEAS.md — making every project pull its weight

A per-project manifest of ideas to make each repo in `F:\Programming\` more
compelling as part of a frontend-job portfolio. Ordered roughly by how much
portfolio value each project can deliver per hour of polish.

The recurring theme: **recruiters and hiring managers don't clone repos.**
Every project needs at least one of: a live URL, a 30-second GIF at the top
of its README, or a number that makes an engineer raise an eyebrow.

---

## Cross-cutting moves (do these once, benefit everywhere)

1. **README hero treatment.** Every repo gets: a one-line pitch, a GIF or
   screenshot above the fold, a "why this is hard" paragraph, and a stack
   list. The portfolio site links to repos; the repos must not be a wall of
   text when someone lands there.
2. **Public-safe mirrors.** Most repos are private (and intentionally commit
   `.env` — see PUBLIC_RELEASE.md). For each portfolio-featured project,
   create a *fresh public* repo following the PUBLIC_RELEASE.md checklist
   (strip `.env*`, add `.env.example`, rotate credentials, secret-scan, init
   fresh). A portfolio that links to 404s is worse than no links.
3. **Numbers beat adjectives.** "Fast" is noise; "600 Hz poll rate, P99
   jitter 1.8 ms" is signal. Wherever a TODO mentions a measurable target,
   run the measurement and publish the table.
4. **One flagship case study per category.** Write 600–900 words each for:
   an overlay (GSCNewLayout), a systems piece (RBY-GameHook), and a pipeline
   (Hyperframes). Host them on TeoPeralez.com; link from everywhere.
5. **Demo video discipline.** The IRLPC Hyperframes pipeline exists to make
   videos — eat the dog food and produce a 60-second "tour of my projects"
   video THROUGH the pipeline, then feature the video AND the pipeline run
   artifacts (storyboard.html, fcpxml) side by side. That's a portfolio
   inception no one else will have.

---

## Tier 1 — flagships (highest payoff)

### RBY / GSC / RSE NewLayout (the overlay family)
**The hook:** real-time UI over live emulator memory — genuinely rare
frontend work.
- Record a 30 s GIF of the damage calc + TTKO updating live during a battle;
  put it at the top of all three READMEs and the portfolio.
- Publish a feature-matrix table (RBY vs GSC vs RSE columns) — it shows
  product thinking and makes "feature parity" roadmap items legible.
- GSCNewLayout is marked ✅ COMPLETE with Win + dual-arch macOS builds: add
  release-download badges and a "built with GitHub Actions" badge; shipped
  cross-platform desktop software is a differentiator.
- Write up the damage calculator as a case study: Gen 2 mechanics (weather,
  screens, burn, badges, semi-invuln double damage, Hidden Power variable
  power) as a *correctness problem* — include the test table comparing your
  outputs to a reference calculator.
- The refactor/componentize branch is a story worth telling: "decomposing a
  shipped Electron monolith without breaking weekly live runs."
- RSE's NSIS "failed creating mmap" bug → short postmortem when fixed.
  Packaging war stories read as senior experience.

### RBY-GameHook
**The hook:** you didn't just use the tool — you forked it, fixed
distribution, and built its update infrastructure.
- The "657 supporting files → single-file publish" postmortem is the best
  blog post in the workspace. `dotnet build` vs `dotnet publish
  /p:PublishSingleFile=true`, 55 MB WebAPI / 99 MB WPF results, verified
  localhost:8085. Write it; link it from the README.
- Architecture diagram: emulator → PokeAByte shared memory → GameHook →
  WebSocket → overlay → OBS. (The portfolio's v2-editorial version already
  draws this — reuse it in the README.)
- Document the AutoUpdater.xml flow: release workflow → rewrites a static
  asset on TeoPeralez.com → Vercel deploy → desktop app self-updates.
  Cross-repo release choreography is a strong systems-design signal.
- Run the planned polling benchmark (1c in TODO.md) and publish: achieved
  Hz, missed/duplicate reads, P50/P99 jitter, CPU. One table, huge credibility.

### AhShuckie
**The hook:** Rust emulator fork with deterministic replays.
- README needs the NIDO/RINA replay-format explanation (packet-based,
  zstd-compressed, save-state keyframes, input injection) — format design
  is a magnet for systems-curious interviewers.
- Ship Phase 2 (`POST /start-recording` / `/stop-recording`) and demo the
  end-to-end loop: overlay's `setMyPokemon()` fires → run auto-recorded →
  replay regenerates the run. Record THAT as a GIF.
- The Phase 4 pitch is gold: "if the binary replay is lost but the JSONL
  input log survives, re-inject inputs to regenerate the video." Tell it as
  a disaster-recovery design story.
- Be loud about GPL-3.0 compliance and the hard-fork relationship — license
  literacy is a quiet senior signal.

### IRLPC Hyperframes
**The hook:** a 12-step LLM orchestration with a human approval gate —
production AI engineering, not a chatbot demo.
- Publish one full pipeline run's artifacts: inventory.json, skeleton plan,
  the storyboard HTML, a screenshot of the approval UI, the final FCPXML.
  Redact freely; the artifact trail is the proof.
- The cost-tiering design (gpt-4o-mini for bulk, Claude Sonnet for planning
  and `--strict` audits) deserves its own section: "engineering around LLM
  economics."
- The approval gate (React + Express on :5173, per-line approve/reject,
  rejected lines block render) is the *frontend* story inside the AI
  project — screenshot it prominently.
- Finish the why-i-love-living-in-japan v2 cut and embed it: pipeline +
  output in one place.

---

## Tier 2 — strong supporting cast

### PokerSolver
- Browser demo or it didn't happen: compile the evaluator core to WASM (or
  port it) and host an equity calculator on TeoPeralez.com. Interactive
  beats description.
- When the background scheduler lands, publish DB stats: "N flop subsets
  solved, M GB of strategies" — concrete scale.
- Show a strategy grid (13×13 range matrix with color-coded actions) — it's
  visually striking and instantly communicates the domain.

### bg-removal-hybrid / -review / -touchup
- Before/after image strips in each README — CV projects sell themselves
  visually or not at all.
- The unified-GUI merge (TODO #20) is a portfolio piece in itself: "merging
  three single-purpose tools into one product" — document the UX decisions.
- Publish throughput: images/hour through the review GUI vs raw manual
  masking. Tooling-leverage numbers impress.

### GSC-Member-Picks / RBY-Member-Picks (+ planned RE-Member-Picks)
- These are *products with users* — say so: member counts, downloads served,
  uptime. Even modest numbers beat zero context.
- Screenshot the tierlists and status screens; they're distinctive UI.
- The free/paid download system (TODO #6) is e-commerce experience — name
  the payment flow and the gating design in the README.
- When RE-Member-Picks happens, write "shipping the third site in a family:
  what I extracted into shared components."

### TeoPeralez.com
- It hosts GameHook's AutoUpdater feed — "my personal site is release
  infrastructure for my desktop app" is a great line; add the diagram.
- The planned rewrite (TODO #5) should *become* one of these four portfolio
  versions (or link to them) instead of being a separate effort.

### FileOrganizer
- Quantify: "N hours of video transcribed, M files auto-renamed/grouped."
- Show one before/after directory listing — chaos → order in one screenshot.

### YTBiz
- Cross-project momentum story: "time tracking triggered by my own tools
  (overlay run starts, Resolve launches)" — the integration matrix sells the
  builder mindset. A week-heatmap screenshot would land well.

### resolve-mcp
- MCP is hot; this rides the wave. README: tool list, a clip of an agent
  driving a Resolve edit, and the Hyperframes connection ("the pipeline
  emits FCPXML; the MCP server lets an agent finish the edit").

---

## Tier 3 — texture and breadth

### Emerald Rom Builder + ROM-hacking cluster
(pokecrystal patches, spinning-trainer removal, Gen 1 backporting,
competitive-moveset ROMs, gym-leader ROMs, pokecrystal-umb)
- Consolidate into ONE "ROM engineering" page/README — individually niche,
  collectively a deep low-level competence signal (Z80/GBA asm, build
  pipelines, data extraction from Smogon).
- The Smogon → moveset injection deserves a diagram: scrape → transform →
  inject → build → verify.

### pokemon-exp-calculator
- Smallest possible polish: host it, link it. A tiny live tool beats a
  perfect description.

### Discord-Bot
- Finish the free-tier deployment (TODO #18) and document the platform
  comparison table you build along the way — pragmatic ops content.

### EarningsAnalyticsAggregator / DailyMembersUpdater
- One-paragraph READMEs + a redacted screenshot each. They're "boring
  reliable infrastructure" — frame exactly that way; reliability is a
  feature.

### gemma-agent
- "Local-first agent, no API dependency" is a sharp angle — show one
  offline tool-use transcript.

### PokemonOfficialArtwork / FamilyMedia / MSCS
- Low priority. One honest paragraph each. MSCS: list 2-3 standout
  assignments (the ML project, the OS work) rather than the whole transcript.

### Skipped-from-manifest folders (img2video-workflow, Hyperframes local,
Scott Gen 3 overlay code)
- img2video-workflow: the 32 GB ComfyUI install isn't portable, but the
  *model-download tooling* (HuggingFace split_files flattening fix) is a
  shareable script + short writeup.
- If any produce visual output, harvest stills for the portfolio's
  visual texture even if the code stays local.

---

## The meta-move

This workspace's strongest portfolio artifact might be the workspace itself:
a 26-repo monorepo-of-repos with a bootstrap manifest, AI-agent operating
instructions (AGENTS.md), a public-release security checklist, and a
prioritized master backlog. That's staff-engineer-shaped operational
maturity. Consider a short piece: **"How I run 26 side projects without
losing my mind"** — bootstrap scripts, repos.json, the TODO discipline, and
the cost-tiered AI delegation policy. Hiring managers remember essays like
that longer than any single demo.
