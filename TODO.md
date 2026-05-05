# Project TODO List (AI Assistance Required)

This file tracks high-priority to low-priority projects that will need AI assistance. Each item includes a summary of the current status and next steps.

---

## 0. IRLPC Hyperframes — Revised 12-Step Pipeline (Path B, in progress)

**Current Status (2026-05-01):**

User signed off on a 12-step revised pipeline that orchestrates
transcription → LLM A/B-roll classification → research → asset fetch →
high-end interactive skeleton plan → low-cost section scripts →
high-end audit + clip mapping → HTML storyboard → user approval gate
→ ≤30 s clip rendering → 4-track FCPXML → DaVinci Resolve 20+ edit.

Path **B** chosen: build the full pipeline first, slip the original
5/2 video deadline. First deliverable through the new pipeline is
`why-i-love-living-in-japan` v2 final cut.

Key locked decisions:

- **Low-cost LLM:** `gpt-4o-mini` (existing OpenAI / GitHub Models path).
- **High-end LLM:** Claude Sonnet 4.6 via Copilot Chat / `runSubagent`
  prompt-relay pattern, **plus `--auto-anthropic` direct API path
  shipped in P1** for headless runs.
- **TTS:** none in pipeline. Resolve 21 voice-clone is added
  per-clip and **mixes onto A1 alongside A-roll dialogue** (single
  audio track preserved end-to-end).
- **Approval gate:** **React app** under `storyboard-ui/` served by
  Express on `http://localhost:5173`. Granularity is **per-section
  AND per-clip-mapping line** (every audited line is its own
  approve/reject record; rejected lines block render).
- **FCPXML:** 1.11 (Resolve 20+).
- **Clip cap:** 30 s per section; auto-split halves above that
  using the proven `STEM_RANGE` mechanism.
- **A/B-roll naming:** auto-rename to `aroll-NNN-<slug>.<ext>` /
  `broll-NNN-<slug>.<ext>` (dry-run by default; `--apply`).

Detailed implementation plan (the source of truth):
[IRLPC Hyperframes/plans/REVISED_PIPELINE.md](IRLPC%20Hyperframes/plans/REVISED_PIPELINE.md).

**Next Steps (phased):**

1. **P1 — Foundations.** Add `scripts/lib/llm.mjs` (low-cost +
   high-end relay), update `scripts/lib/projects.mjs`, scaffold
   `scripts/approval_server.mjs` (Express, port 5173).
2. **P2 — Inventory.** Build `scripts/abroll_classify.mjs`
   (ffprobe loudness + Whisper presence + filename hints +
   gpt-4o-mini vision tiebreaker). Output
   `metadata/inventory.json`. Run on why-i-love-living-in-japan
   A-roll directory and tune.
3. **P3 — Migration.** Run
   `scripts/migrate_project_to_subdir.mjs --apply` for
   why-i-love-living-in-japan; fix `compositions/compose.mjs`
   paths per the irlpc-hyperframes-projects-layout follow-ups.
4. **P4 — Generators.** Implement `skeleton_plan.mjs` (interactive
   Q&A via approval UI), `section_scripts.mjs` (low-cost),
   `audit_script.mjs` (high-end, `--strict`).
5. **P5 — Storyboard.** Implement `storyboard.mjs` (HTML node-graph
   with thumbnails, Hyperframes iframes, transition arrows) +
   approval UI completion.
6. **P6 — Render.** Implement `render_sections.mjs` (30 s cap with
   auto-halving), make `render_chapters.mjs` project-aware.
7. **P7 — FCPXML.** Implement `build_fcpxml.mjs` (V1 Hyperframes /
   V2 A-roll / V3 B-roll / A1 dialogue-only audio).
8. **P8 — Validate.** End-to-end run on why-i-love-living-in-japan
   v2. Acceptance criteria in §4 of REVISED_PIPELINE.md.
9. **P9 — Ship.** User completes DaVinci Resolve edit and final
   render; commit Resolve project under
   `projects/why-i-love-living-in-japan/work/`.

**Open risks tracked in REVISED_PIPELINE.md §5:**

- Resolve 21 voice-clone export format (need to confirm A1
  preservation before P7).
- Relay-pattern friction; ship `--auto-anthropic` early if needed.
- B-roll loudness tuning for ambient audio.
- Storyboard HTML perf with hundreds of thumbnails.

**Out of scope for v2** (deferred): music-bed selection, pipeline
TTS, multi-language captions, auto-publish, LLM thumbnail design.

---

## 1. RBY-GameHook (Highest Priority)

**Current Status:**

**Earlier context:**
	- The initial build failed due to the .NET SDK not being installed (project targets net8.0).
	- Options discussed:
		1. Install the .NET 8 SDK locally and build/publish with `dotnet build` or `dotnet publish`.
		2. Use the GitHub Actions release workflow to produce signed release artifacts (requires ACCESS_TOKEN secret).
		3. Use the standalone RBY-GameHook.exe (also requires .NET SDK).
	- User agreed to proceed with option 1 (install SDK and build locally).

- The desktop GUI (GameHook.WPF.exe) builds successfully and launches.
- The application embeds the GameHook web UI and launches the WebAPI in-process.
- **RESOLVED (2026-04-29):** Root cause of the "657 supporting files" issue was that `dotnet build` was used instead of `dotnet publish` with `PublishSingleFile=true`.
  - Added `<PublishSingleFile>true</PublishSingleFile>` to `src/GameHook.WPF/GameHook.WPF.csproj` (the WebAPI csproj already had it).
  - Published both projects with `dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeAllContentForSelfExtract=true`.
  - Output: standalone `GameHook.WebAPI.exe` (~55 MB) at `src/GameHook.WebAPI/bin/Release/net8.0/win-x64/publish/` (this matches the older simple `GameHook.exe` distribution).
  - Output: standalone `GameHook.WPF.exe` (~99 MB, WebView2 shell) at `src/GameHook.WPF/bin/Release/net8.0-windows/win-x64/publish/` (still ships satellite locale folders + runtimes alongside, but the .exe itself is single-file).
  - **Verified working:** Running `GameHook.WebAPI.exe` exposes `http://localhost:8085` correctly (HTTP 200, 43 KB index page served).
- Not yet integrated to fully work with the GBS/NDS version of supershuckie.

**Next Steps:**
- ~~Implement a single executable that loads the GUI and a persistent localhost:8085 instance.~~ **DONE** — both `GameHook.WebAPI.exe` (headless, like the old `GameHook.exe`) and `GameHook.WPF.exe` (WebView2 GUI) now publish as single-file self-contained executables.
- ~~Investigate why the web application is not exposing localhost as expected.~~ **DONE** — root cause was `dotnet build` vs `dotnet publish`; localhost:8085 confirmed working.
- Test `GameHook.WPF.exe` (the GUI shell) end-to-end now that it's properly single-file packed.
- Reduce satellite/locale folder noise alongside `GameHook.WPF.exe` (consider `<SatelliteResourceLanguages>en</SatelliteResourceLanguages>` in csproj).
- ~~Auto-updater pointed at the original upstream's CDN (cdngamehook.merkelhaus.us) and showed a "Update Check Failed" popup on launch.~~ **Disabled** in `MainWindow.xaml.cs` until our own update infrastructure exists.
- ~~**Stand up our own AutoUpdater XML feed and mappers CDN** (replaces `cdngamehook.merkelhaus.us`):~~ **DONE (infrastructure)** — the feed lives at `https://teoperalez.com/gamehook/AutoUpdater.xml` (Next.js static asset under `TeoPeralez.com/public/gamehook/`, auto-deployed by Vercel on push to `main`). The release workflow now has a `publish-updater-xml` job that rewrites that file on every release. Mappers come from the `teoperalez/mappers` repo. AutoUpdater URL in `MainWindow.xaml.cs` updated to the new feed (still gated by `false &&` until the first real release is cut).
    - ~~Host an `AutoUpdater.NET`-compatible XML feed describing latest version + download URL.~~ Done.
    - ~~Host signed release artifacts (e.g., GitHub Releases or our own CDN).~~ Workflow targets GitHub Releases.
    - ~~Host the mappers repo equivalent (currently `teoperalez/mappers` referenced by `create-release.yml`).~~ Repo created.
    - ~~Re-enable the AutoUpdater block in `MainWindow.xaml.cs` (remove the `false &&` guard) **after** confirming the first release publishes a valid manifest.~~ **DONE**
- ~~**Cut the first GitHub release (v0.0.0.0)** — manually trigger `create-release.yml` via Actions tab to validate the full pipeline (build, release, mappers release, push AutoUpdater.xml to TeoPeralez.com).~~ **DONE** — first release built successfully across Windows/Linux/macOS, AutoUpdater.xml published to teoperalez.com.
- ~~Reduce locale folder noise alongside `GameHook.WPF.exe`~~ **DONE** — added `<SatelliteResourceLanguages>en</SatelliteResourceLanguages>` and post-publish cleanup target.
- ~~Fix C# build warnings (`RetroArchUdpPollingDriver.cs:226` null-check, `BuildEnvironment.cs:25` single-file Assembly.Location).~~ **DONE**
- Begin integration work with the GBS/NDS version of supershuckie now that builds are reliable. **In progress** — see new project below (`AhShuckie`) for the fork.
- Verify supershuckie integration uses the persistent localhost:8085 endpoint correctly for overlay projects.

---

## 1b. AhShuckie (fork of SnowyMouse/supershuckie)

**Current Status:**
- Cloned `SnowyMouse/supershuckie` to `F:\Programming\AhShuckie`. Hard-fork: own `main` branch, no upstream remote.
- Investigation complete. SuperShuckie already provides:
    - PokeAByte UDP + shared-memory protocol (`127.0.0.1:55356`) for memory read/write/freeze. The existing `SuperShuckieDriver.cs` in RBY-GameHook should already speak this.
    - HTTP REST API (`127.0.0.1:30158`) with `/stats`, `/go-to-frame`, `/set-paused`, `/set-playback-speed`, `/load-replay`, `/increment-counter`, `/mark-start`, `/mark-end`.
    - Full replay file format (NIDO/RINA, packet-based, zstd-compressed) with input-injection packets, save-state keyframes, deterministic playback.
    - `run_unlocked()` mode for max-speed emulation (already implemented internally).
- License: GPL-3.0-only (preserved).
- README updated to reflect fork relationship and roadmap.

**Next Steps:**
- ~~Create `teoperalez/AhShuckie` GitHub repo~~ (in progress; user creating empty repo via UI).
- Push baseline commit (upstream snapshot + fork README).
- **Phase 1:** Profile high-rate polling — verify GameHook can poll PokeAByte shared memory at 600 Hz (10× game speed) without drops. Document findings.
- **Phase 2:** Add `POST /start-recording` and `POST /stop-recording` endpoints to `supershuckie-frontend-webserver`. Wire `RBYNewLayout`'s `setMyPokemon()` to call them with auto-named replay files.
- **Phase 3:** Add global input logger to `RBYNewLayout` (writes JSONL alongside `.shuckie` replay).
- **Phase 4:** Add `POST /inject-input` endpoint so an `.inputs.jsonl` log can be played back through AhShuckie to regenerate lost videos.
- Set up own release pipeline + AutoUpdater feed at `teoperalez.com/ahshuckie/` matching the GameHook pattern.

---

## 1c. AhShuckie Phase 1 — High-rate polling validation

**Current Status:**
- Not started. Prerequisite for Phases 2–4.
- Hypothesis: AhShuckie can run the emulator unlocked at ~10× speed (≈600 fps for GB/GBC, ≈1000 fps for GBA depending on host CPU). RBY-GameHook needs to poll PokeAByte shared memory fast enough to not miss critical state transitions (battle start/end, encounter type, HP-zero events) at those speeds.

**Next Steps:**
1. Write a benchmark harness (small C# console app or extend GameHook.Domain tests) that polls the PokeAByte shared-memory block at 1 ms intervals while AhShuckie runs unlocked.
2. Measure: actual achieved poll rate, missed/duplicate reads, jitter (P50/P99), CPU usage.
3. Document results in `RBY-GameHook/docs/polling-benchmark.md`.
4. Decide whether the existing pull-based driver is sufficient, or whether AhShuckie needs to push state-change events (e.g., via the existing webserver or a new socket) instead.

---

## 1d. AhShuckie Phase 2 — Replay recording endpoints + RBYNewLayout wiring

**Current Status:**
- Not started. Depends on Phase 1 for confidence that high-rate polling works.
- AhShuckie's frontend webserver already has `/load-replay`, `/go-to-frame`, `/set-paused`, etc. but **no programmatic start/stop of recording** — recording is currently toggled only via the GUI.

**Next Steps:**
1. In `AhShuckie/crates/supershuckie-frontend-webserver/`, add two new REST endpoints:
    - `POST /start-recording` — body: `{ "filename": "RBY_2026-04-29_HHMMSS.shuckie" }`. Returns 200 if recording started, 409 if already recording.
    - `POST /stop-recording` — returns 200 with the final filename and frame count.
2. Wire the webserver actions through the existing recording state machine (look at GUI handlers for the "Start/Stop Recording" buttons as the reference implementation).
3. In `RBYNewLayout`, hook `setMyPokemon()` (and the equivalent run-start signal) to fire `POST /start-recording` with an auto-generated filename based on the run's seed/timestamp/Pokémon. Hook run-end (death / champion defeat) to fire `POST /stop-recording`.
4. Add a config toggle in RBYNewLayout settings: "Auto-record runs to AhShuckie" (default off).

---

## 1e. AhShuckie Phase 3 — Global input logger in RBYNewLayout

**Current Status:**
- Not started. Independent of Phases 1–2 but most useful when combined with Phase 2's auto-recording.
- Goal: capture every controller/keyboard input the player makes during a run, with frame-accurate timestamps, so we have a redundant text log alongside the binary `.shuckie` replay.

**Next Steps:**
1. In `RBYNewLayout` (Electron main process), add a global input listener (e.g., `iohook` or native module) that captures keyboard + gamepad events even when RBYNewLayout isn't focused.
2. Time-align each input with the current AhShuckie frame number (poll `/stats` or subscribe to a frame-number stream).
3. Write events as JSON Lines to `<run-dir>/inputs.jsonl` alongside the `.shuckie` file: `{ "frame": 12345, "ts": 1714397123456, "device": "gamepad0", "button": "A", "state": "down" }`.
4. Add log rotation / size cap to avoid unbounded growth on long runs.

---

## 1f. AhShuckie Phase 4 — Input injection endpoint (replay regeneration)

**Current Status:**
- Not started. Final piece of the recovery pipeline: if a `.shuckie` replay file is lost or corrupted but the `inputs.jsonl` log survives, we can replay the inputs through AhShuckie to regenerate the run video.

**Next Steps:**
1. In `AhShuckie/crates/supershuckie-frontend-webserver/`, add `POST /inject-input`:
    - Body: `{ "frame": 12345, "device": "gamepad0", "button": "A", "state": "down" }` (single-event), OR streamable NDJSON for bulk replay.
    - On the emulator side, queue the input so it fires on the requested frame number.
2. Add a CLI helper (or RBYNewLayout button) that streams `inputs.jsonl` into `/inject-input` while AhShuckie runs from a clean ROM + save state.
3. Verify determinism: the regenerated `.shuckie` should be byte-equivalent (modulo timestamps) to the original recording for the same input log.
4. Document the recovery workflow in `AhShuckie/docs/replay-recovery.md`.

---

*Add additional projects below in priority order, following the same format.*

---

## 23. img2video-workflow (If Time Allows)

**Current Status:**
- img2video-workflow is functional but could benefit from further improvements and optimizations.
- Latest model download (scripts/download_models.ps1 -OnlyWan21) completed, but HuggingFace CLI preserved split_files/... subpaths, causing VAE and CLIP-Vision files to be nested too deep for ComfyUI to find.
- Manual flattening/moving of files required after download.
- Encountered network errors (net::ERR_HTTP2_PING_FAILED) and GitHub/Copilot service disruptions during setup.

**Next Steps:**
1. Review current workflow and identify areas for enhancement (speed, quality, usability, etc.).
2. Implement improvements as time permits.
3. Use AI assistance to:
	- Suggest workflow optimizations
	- Automate repetitive tasks
	- Document changes and best practices

---

## 22. RBY Battle Simulator (GitHub)

**Current Status:**
- The RBY Battle Simulator is not present locally but is available on GitHub.
- Current implementation lacks advanced functionality and high-quality strategy logic.

**Next Steps:**
1. Clone or access the latest version of the RBY Battle Simulator from GitHub.
2. Improve core functionality and add new features as needed.
3. Implement and test improved strategy logic for higher quality battle decisions.
4. Use AI assistance to:
	- Analyze and optimize battle strategies
	- Propose and implement new features
	- Document improvements and usage

---

## 21. PokerSolver: Strategy Mapping & Background Solves

**Current Status:**
- PokerSolver does not yet map strategies as robustly as PioSolver.
- No scheduler exists for running solves in the background to build a strategy database.

**Next Steps:**
1. Improve PokerSolver to map out strategies and outputs similar to PioSolver.
2. Create a scheduler to run solves in the background for every flop, turn, and river across various ranges.
3. Build a database of best strategies for in-position (IP) and out-of-position (OOP) play for 6-max and heads-up poker.
4. Use AI assistance to:
	- Optimize solver logic and outputs
	- Automate background scheduling and data collection
	- Document new features and database structure

---

## 20. Background Removal Apps: Unified GUI

**Current Status:**
- Multiple background removal apps exist in the workspace (e.g., bg-removal-hybrid, bg-removal-review, bg-removal-touchup).
- No single unified GUI for all features.

**Next Steps:**
1. Combine the features of all background removal apps into a single, user-friendly GUI.
2. Ensure the new GUI supports all major workflows (hybrid, review, touchup, etc.).
3. Test for usability, performance, and feature completeness.
4. Use AI assistance to:
	- Propose and refine GUI/UX design
	- Integrate and refactor codebases
	- Document the unified application

---

## 19. YTBiz: Accurate Work Time & Productivity Logging

**Current Status:**
- YTBiz app does not currently log working time or productivity based on overlay/DaVinci Resolve usage.
- No integration with overlays or activity tracking implemented.

**Next Steps:**
1. Update and link YTBiz to log working time for different projects when:
	- A live overlay run is started
	- DaVinci Resolve is launched
2. Implement mouse movement and keystroke tracking to detect when the user is away from the desk.
3. Use tracked data to accurately measure productivity and working time per project.
4. Use AI assistance to:
	- Optimize activity tracking and data logging
	- Analyze productivity patterns
	- Document new features and usage

---

## 18. Discord Bot: Free Deployment

**Current Status:**
- Discord Bot project is functional but not yet deployed.
- No free hosting/deployment solution has been implemented.

**Next Steps:**
1. Research and evaluate free hosting options for deploying the Discord Bot (e.g., Railway, Render, Replit, etc.).
2. Set up deployment pipeline and test bot functionality in production.
3. Document deployment steps and any limitations of free hosting solutions.
4. Use AI assistance to:
	- Compare hosting platforms and recommend best fit
	- Automate deployment and monitoring setup
	- Troubleshoot deployment issues

---

## 17. FileOrganizer: Video Transcription & Metadata Automation

**Current Status:**
- FileOrganizer does not currently support efficient video transcription or automated metadata tagging/naming.

**Next Steps:**
1. Implement efficient video transcription, supporting background processing for large batches.
2. Integrate a low-cost LLM to:
	- Write metadata to each video file
	- Identify and group videos belonging to the same project
	- Rename files appropriately for organization
3. Use AI assistance to:
	- Optimize transcription and metadata workflows
	- Ensure robust project grouping and naming logic
	- Document new features and usage

---

## 16. Gen 3 Mappers: Data Structure Update for GameHook

**Current Status:**
- Deprecated Gen 3 mappers work with GameHook but do not follow the updated data structures used in Gen 1 and Gen 2 mappers.

**Next Steps:**
1. Review and document the current data structures used in Gen 1 and Gen 2 mappers.
2. Update Gen 3 mappers to match these data structures for consistency and compatibility.
3. Test GameHook integration to ensure correct data handling.
4. Use AI assistance to:
	- Analyze and refactor code for structure alignment
	- Validate data consistency across generations
	- Document changes and migration steps

---

## 15. Pokefirered Hack: DMA/Checksum Bypass & GameHook Integration

**Current Status:**
- No existing hack for Pokefirered to stop DMA/checksums and enable GameHook data manipulation.

**Next Steps:**
1. Develop a patch/hack for Pokefirered that disables DMA and checksum protections.
2. Ensure the ROM allows for proper data manipulation and integration with GameHook.
3. Test the hack for stability and compatibility.
4. Use AI assistance to:
	- Identify and modify relevant code sections
	- Automate patch creation and validation
	- Document the process and results

---

## 14. pokecrystal Patch: Remove All Spinning Trainers

**Current Status:**
- No patch exists to remove all spinning trainers (only random spinning trainers may be removed currently).

**Next Steps:**
1. Develop a patch for pokecrystal that removes all spinning trainers from the game.
2. Test the patch to ensure all trainer spinning behavior is eliminated.
3. Use AI assistance to:
	- Identify all relevant code sections for trainer spinning
	- Automate patch creation and validation
	- Document the patching process and results

---

## 13. Gen 1 Backporting (Moves & Sprites)

**Current Status:**
- No comprehensive assembly instructions exist for backporting Gen 2/3 moves to Gen 1.
- Tools for backporting Pokémon sprites to Gen 1 (pokered-gbc/pokeyellow) are incomplete or not finalized.

**Next Steps:**
1. Write detailed assembly instructions for implementing future gen moves (Gen 2/3) in Gen 1 ROMs.
2. Finalize and document tools for backporting Pokémon sprites to Gen 1, supporting both pokered-gbc and pokeyellow projects.
3. Use AI assistance to:
	- Automate move and sprite data conversion
	- Validate compatibility and accuracy
	- Document the process for future contributors

---

## 12. GSC-Member-Picks Challenge Requests

**Current Status:**
- Challenge request feature exists but is not fully implemented or completed.
- User-submitted challenges via GSC-Member-Picks are not yet processed or tracked to completion.

**Next Steps:**
1. Implement backend and UI for submitting, tracking, and managing challenge requests from users.
2. Process and complete outstanding challenge requests.
3. Notify users of challenge status and completion.
4. Use AI assistance to:
	- Streamline challenge request workflows
	- Automate notifications and status updates
	- Document and showcase completed challenges

---

## 11. Competitive Moveset ROMs (Crystal/Emerald/Ruby/FireRed)

**Current Status:**
- No competitive moveset versions exist yet for Pokecrystal, Pokeemerald, Pokeruby, or Pokefirered.
- Similar projects exist for Pokeyellow and Pokered.

**Next Steps:**
1. Fetch competitive movesets for each Pokémon in the relevant generation from a resource like Smogon.com.
2. Update all Pokémon in each ROM (Crystal, Emerald, Ruby, FireRed) to use the competitive movesets.
3. Build and test each ROM to ensure correctness and balance.
4. Use AI assistance to:
	- Automate moveset data extraction and insertion
	- Validate moveset accuracy and game balance
	- Document the process and results

---

## 10. pokecrystal-umb

**Current Status:**
- The Unown ROM did not build properly; build issue unresolved.
- ROMs are not yet complete.

**Next Steps:**
1. Diagnose and resolve the build issue preventing the Unown ROM from compiling.
2. Complete building all required ROMs for the project.
3. Use AI assistance to:
	- Analyze build logs and errors
	- Suggest and implement fixes
	- Validate and document successful builds

---

## 9. pokecrystal-gym-leaders

**Current Status:**
- Project partially complete: not all Gen 2 gym leader ROMs are finished.
- No support yet for later generation gym leaders (e.g., Emerald, Platinum).

**Next Steps:**
1. Complete making ROMs for all Gen 2 gym leaders.
2. Extend support to include teams for later generation gym leaders (Pokemon Emerald, Pokemon Platinum, etc.).
3. Use AI assistance to:
	- Automate ROM creation and team data entry
	- Validate accuracy of gym leader teams
	- Document process and progress

---

## 8. RE-Member-Picks (New Website)

**Current Status:**
- No website exists yet for RE-Member-Picks.
- Needs to match features and user experience of GSC-Member-Picks and RBYPC2025/RBY-Member-Picks.

**Next Steps:**
1. Design and build a new website for RE-Member-Picks from scratch.
2. Implement all features present in GSC-Member-Picks and RBYPC2025/RBY-Member-Picks (status screens, tierlists, resources, free/paid downloads, etc.).
3. Ensure UI/UX consistency and seamless integration with the other member-picks projects.
4. Use AI assistance to:
	- Accelerate design and development
	- Audit for feature completeness and parity
	- Test and document the new site

---

## 7. RBYPC2025/RBY-Member-Picks

**Current Status:**
- Project is live but lacks feature parity with GSC-Member-Picks.
- Missing advanced features for user engagement and downloads.

**Next Steps:**
1. Review all features implemented in GSC-Member-Picks (status screens, tierlists, resources, free/paid downloads).
2. Implement equivalent features in RBYPC2025/RBY-Member-Picks for full parity.
3. Ensure UI/UX consistency and seamless user experience across both projects.
4. Use AI assistance to:
	- Audit for missing features and gaps
	- Accelerate implementation of new features
	- Test and document all updates

---

## 6. RBYP2025/GSC-Member-Picks

**Current Status:**
- Project is live but missing several advanced features for user engagement and monetization.
- No minimum battles series status screens, tierlists, or resource/download sections implemented yet.

**Next Steps:**
1. Add minimum battles series status screens to track progress and stats.
2. Implement tierlists for member picks and featured content.
3. Create a resources and downloads section for overlays, patch files, and other assets.
4. Develop a system for free and paid downloads, allowing users to access premium features and files.
5. Use AI assistance to:
	- Design engaging status screens and tierlist UIs
	- Plan and implement secure download/payment flows
	- Test and document all new features

---

## 5. TeoPeralez.com

**Current Status:**
- The site is live but only the main music channel is fully connected.
- Other channels lack proper site connections.
- UI and styling are basic and could be improved.

**Next Steps:**
1. Wire in proper connections to external sites for each channel, not just the main music channel.
2. Rewrite the app with improved styling and new features, leveraging Claude Opus 4.7 for design and UI suggestions.
3. Use AI assistance to:
	- Propose modern, responsive UI/UX improvements
	- Ensure all channels are discoverable and well-integrated
	- Test and document new features and connections

---

## 4. GSCNewLayout

**Current Status:** ✅ **COMPLETE**
- Damage calculator + turns-to-KO display fully wired (Gen 2-aware:
  weather, held items, Reflect / Light Screen, burn, badges, STAB,
  type effectiveness, semi-invuln double damage, Hidden Power /
  Return / Frustration variable power).
- Automatic OBS chapter markers shipped via persistent powershell
  helper (Windows) and `osascript` (macOS).
- Cross-platform: Windows portable `.exe`, macOS `.dmg` for both
  Apple Silicon and Intel. Hotkeys updated for Cmd/Option parity.
- GitHub Actions release workflow at
  [.github/workflows/release.yml](GSCNewLayout/.github/workflows/release.yml).
- Comprehensive README with usage, GameHook integration, OBS
  integration, hotkeys table, and macOS setup guide.

**Future work:**
- 🎬 **Promo video** — generate a Hyperframes-driven promo video for
  the GSCNewLayout project (separate project under
  [IRLPC Hyperframes](IRLPC%20Hyperframes/)). Highlight the damage
  calculator, TTKO display, gym leader cards, tier list views, and
  cross-platform support.

---

## 3. RSENewLayout (macOS/Win port)

**Current Status:**
- All code changes for macOS compatibility, electron-builder packaging, versioning, and README are complete and pushed to GitHub.
- Windows build step failed at the NSIS installer stage due to a `failed creating mmap` error on the `.nsis.7z` file. This is likely caused by disk space, file lock, or Unicode/encoding issues (see electron-builder/NSIS docs for details).
- The macOS and Linux build steps are not yet tested.

**Next Steps:**
- Investigate and resolve the NSIS build error (try cleaning `dist/`, check disk space, and replace special characters in the app description).
- Once resolved, verify that all artifacts are produced in `dist/` and test the resulting builds on both Windows and macOS.
- Public release and further testing will be completed after the next project is finished.

---

## 3. img2video-workflow (next up)

**Current Status:**
- Pending: flatten HuggingFace `split_files/` subdirectories after model download so VAE and CLIP-Vision files are found by ComfyUI.

**Next Steps:**
- Write and run a script to move all files from nested `split_files/` subfolders to the parent directory expected by ComfyUI.
- Test workflow end-to-end after flattening.

---

## 2. RSENewLayout

**Current Status:**
- Project is functional but missing several key features and improvements.
- Trainer mapping (required/optional) is incomplete and not yet data-driven.
- No logging feature for state variables or trainer battles (unlike RBYNewLayout).
- Automatic marker features and post-gym leader tier cards/tierlists are not yet implemented.
- Project experiences random crashes and odd behavior around state changes.

**Next Steps:**
1. Implement a logging feature similar to RBYNewLayout:
	- Track state variables, trainers fought, and other relevant gameplay events.
	- Use this data to build a comprehensive required trainers list.
2. Map all trainers to required or optional status using the new logging data.
3. Implement automatic marker features and post-gym leader tier cards/tierlists, matching RBYNewLayout's implementation.
4. Investigate and resolve the causes of random crashes and state change issues.
5. Use AI assistance to:
	- Review and optimize logging and state management code
	- Ensure feature parity with RBYNewLayout for tier/tierlist features
	- Debug and document crash causes and fixes

---

## 1. RBY-GameHook (Highest Priority)

**Current Status:**

**Earlier context:**
	- The initial build failed due to the .NET SDK not being installed (project targets net8.0).
	- Options discussed:
		1. Install the .NET 8 SDK locally and build/publish with `dotnet build` or `dotnet publish`.
		2. Use the GitHub Actions release workflow to produce signed release artifacts (requires ACCESS_TOKEN secret).
		3. Use the standalone RBY-GameHook.exe (also requires .NET SDK).
	- User agreed to proceed with option 1 (install SDK and build locally).

- The desktop GUI (GameHook.WPF.exe) builds successfully and launches.
- The application embeds the GameHook web UI and launches the WebAPI in-process.
- **RESOLVED (2026-04-29):** Root cause of the "657 supporting files" issue was that `dotnet build` was used instead of `dotnet publish` with `PublishSingleFile=true`.
  - Added `<PublishSingleFile>true</PublishSingleFile>` to `src/GameHook.WPF/GameHook.WPF.csproj` (the WebAPI csproj already had it).
  - Published both projects with `dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeAllContentForSelfExtract=true`.
  - Output: standalone `GameHook.WebAPI.exe` (~55 MB) at `src/GameHook.WebAPI/bin/Release/net8.0/win-x64/publish/` (this matches the older simple `GameHook.exe` distribution).
  - Output: standalone `GameHook.WPF.exe` (~99 MB, WebView2 shell) at `src/GameHook.WPF/bin/Release/net8.0-windows/win-x64/publish/` (still ships satellite locale folders + runtimes alongside, but the .exe itself is single-file).
  - **Verified working:** Running `GameHook.WebAPI.exe` exposes `http://localhost:8085` correctly (HTTP 200, 43 KB index page served).
- Not yet integrated to fully work with the GBS/NDS version of supershuckie.

**Next Steps:**
- ~~Implement a single executable that loads the GUI and a persistent localhost:8085 instance.~~ **DONE** — both `GameHook.WebAPI.exe` (headless, like the old `GameHook.exe`) and `GameHook.WPF.exe` (WebView2 GUI) now publish as single-file self-contained executables.
- ~~Investigate why the web application is not exposing localhost as expected.~~ **DONE** — root cause was `dotnet build` vs `dotnet publish`; localhost:8085 confirmed working.
- Test `GameHook.WPF.exe` (the GUI shell) end-to-end now that it's properly single-file packed.
- Reduce satellite/locale folder noise alongside `GameHook.WPF.exe` (consider `<SatelliteResourceLanguages>en</SatelliteResourceLanguages>` in csproj).
- ~~Auto-updater pointed at the original upstream's CDN (cdngamehook.merkelhaus.us) and showed a "Update Check Failed" popup on launch.~~ **Disabled** in `MainWindow.xaml.cs` until our own update infrastructure exists.
- ~~**Stand up our own AutoUpdater XML feed and mappers CDN** (replaces `cdngamehook.merkelhaus.us`):~~ **DONE (infrastructure)** — the feed lives at `https://teoperalez.com/gamehook/AutoUpdater.xml` (Next.js static asset under `TeoPeralez.com/public/gamehook/`, auto-deployed by Vercel on push to `main`). The release workflow now has a `publish-updater-xml` job that rewrites that file on every release. Mappers come from the `teoperalez/mappers` repo. AutoUpdater URL in `MainWindow.xaml.cs` updated to the new feed (still gated by `false &&` until the first real release is cut).
    - ~~Host an `AutoUpdater.NET`-compatible XML feed describing latest version + download URL.~~ Done.
    - ~~Host signed release artifacts (e.g., GitHub Releases or our own CDN).~~ Workflow targets GitHub Releases.
    - ~~Host the mappers repo equivalent (currently `teoperalez/mappers` referenced by `create-release.yml`).~~ Repo created.
    - ~~Re-enable the AutoUpdater block in `MainWindow.xaml.cs` (remove the `false &&` guard) **after** confirming the first release publishes a valid manifest.~~ **DONE**
- ~~**Cut the first GitHub release (v0.0.0.0)** — manually trigger `create-release.yml` via Actions tab to validate the full pipeline (build, release, mappers release, push AutoUpdater.xml to TeoPeralez.com).~~ **DONE** — first release built successfully across Windows/Linux/macOS, AutoUpdater.xml published to teoperalez.com.
- ~~Reduce locale folder noise alongside `GameHook.WPF.exe`~~ **DONE** — added `<SatelliteResourceLanguages>en</SatelliteResourceLanguages>` and post-publish cleanup target.
- ~~Fix C# build warnings (`RetroArchUdpPollingDriver.cs:226` null-check, `BuildEnvironment.cs:25` single-file Assembly.Location).~~ **DONE**
- Begin integration work with the GBS/NDS version of supershuckie now that builds are reliable. **In progress** — see new project below (`AhShuckie`) for the fork.
- Verify supershuckie integration uses the persistent localhost:8085 endpoint correctly for overlay projects.

---

## 1b. AhShuckie (fork of SnowyMouse/supershuckie)

**Current Status:**
- Cloned `SnowyMouse/supershuckie` to `F:\Programming\AhShuckie`. Hard-fork: own `main` branch, no upstream remote.
- Investigation complete. SuperShuckie already provides:
    - PokeAByte UDP + shared-memory protocol (`127.0.0.1:55356`) for memory read/write/freeze. The existing `SuperShuckieDriver.cs` in RBY-GameHook should already speak this.
    - HTTP REST API (`127.0.0.1:30158`) with `/stats`, `/go-to-frame`, `/set-paused`, `/set-playback-speed`, `/load-replay`, `/increment-counter`, `/mark-start`, `/mark-end`.
    - Full replay file format (NIDO/RINA, packet-based, zstd-compressed) with input-injection packets, save-state keyframes, deterministic playback.
    - `run_unlocked()` mode for max-speed emulation (already implemented internally).
- License: GPL-3.0-only (preserved).
- README updated to reflect fork relationship and roadmap.

**Next Steps:**

**Proposed New Workflow:**
1. **Transcribe existing video clips.**
2. **Low-cost LLM:** Analyze each video and transcript to apply metadata, rename files, and categorize as A-roll or B-roll.
3. **Low-cost LLM:** Analyze transcript contents, suggest themes for additional B-roll, and research topics/tidbits for titling and context.
4. **Fetch image assets** from sources like Pexels/Openverse for additional B-roll.
5. **High-end LLM:** Ask the user targeted questions to create a skeleton plan (script structure, clip order, transitions), outputting a markdown guide.
6. **Low-cost LLM:** Write small scripts for each section, prioritizing available content but suggesting extra phrases/analogies for context and smooth transitions.
7. **High-end LLM:** Audit and improve the script, passing each section to the user, clearly noting:
    - Phrases needing speech-to-text generation
    - Which video sections will be used in each part
8. **High-end LLM:** Storyboard the video, creating a webpage with a top-to-bottom flow, nodes, animation, and visual analogies using HTML/CSS and fetched stock images.
9. **User approval:** User reviews and approves sections that will use Hyperframes graphics or generated webpage elements.
10. **Clip generation:** Generate individual video clips (usually up to 30 seconds each).
11. **High-end LLM:** Create the FCPXML file, placing Hyperframes video on a new track, A-roll and B-roll on their own tracks, and exporting only one dialogue audio track.
12. **Final edit:** User completes the edit in DaVinci Resolve.
