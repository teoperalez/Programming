/**
 * Single source of truth for every project shown across all four portfolio
 * versions. Facts are sourced from the meta-repo's TODO.md, repos.json, and
 * AGENTS.md — every number and detail here is real.
 */

export type Category =
  | 'overlay'
  | 'systems'
  | 'ai'
  | 'web'
  | 'rom'
  | 'tools';

export interface Project {
  /** Folder / display name */
  name: string;
  /** GitHub repo slug under github.com/teoperalez/ */
  slug: string;
  category: Category;
  tagline: string;
  /** Longer narrative used by editorial/desktop versions */
  story: string;
  /** Concrete, specific, real details — the "proof" bullets */
  highlights: string[];
  stack: string[];
  /** Real endpoints / artifacts / numbers worth bragging about */
  artifacts?: string[];
  /** Which interactive demo this project maps to, if any */
  demo?: 'damage' | 'poker' | 'memory' | 'pipeline' | 'exp' | 'arch';
  featured: boolean;
  /** Emoji glyph used by card/desktop versions */
  glyph: string;
  status: 'shipped' | 'active' | 'planned';
}

export const PROJECTS: Project[] = [
  {
    name: 'GSCNewLayout',
    slug: 'GSCNewLayout',
    category: 'overlay',
    tagline: 'Gen 2 Pokémon speedrun overlay with a full in-game damage calculator.',
    story:
      'An Electron + React overlay for Pokémon Gold/Silver/Crystal speedruns. Marked COMPLETE in the master backlog: the damage calculator and turns-to-KO display are fully wired and Gen 2-aware, OBS chapter markers fire automatically, and releases build for Windows portable .exe and macOS .dmg on both Apple Silicon and Intel.',
    highlights: [
      'Damage calc handles weather, held items, Reflect / Light Screen, burn, badge boosts, STAB, type effectiveness, semi-invulnerable double damage, and Hidden Power / Return / Frustration variable base power',
      'Turns-to-KO (TTKO) display answers "can I win this fight?" before the next input',
      'Automatic OBS chapter markers via a persistent PowerShell helper on Windows and osascript on macOS',
      'Hotkeys with full Cmd/Option parity between platforms',
      'GitHub Actions release workflow publishes all three artifacts per tag',
    ],
    stack: ['Electron', 'React', 'TypeScript', 'OBS WebSocket', 'GitHub Actions'],
    demo: 'damage',
    featured: true,
    glyph: '🌙',
    status: 'shipped',
  },
  {
    name: 'RBYNewLayout',
    slug: 'RBY-Layout-2026',
    category: 'overlay',
    tagline: 'Gen 1 speedrun overlay — the original of the three-overlay family.',
    story:
      'The Red/Blue/Yellow overlay that the GSC and RSE versions descend from. Logs state variables and every trainer battle to MongoDB Atlas, drives tier cards and post-gym tierlists, and is the reference implementation the other two generations chase for feature parity.',
    highlights: [
      'Run logging: state variables, trainers fought, and gameplay events stored per-run',
      'Tier cards and post-gym-leader tierlists rendered live during runs',
      'Planned AhShuckie integration: setMyPokemon() will auto-fire POST /start-recording to capture a deterministic replay of every run',
      'A refactor/componentize branch is actively splitting the monolith into reusable components',
    ],
    stack: ['Electron', 'React', 'TypeScript', 'MongoDB Atlas'],
    demo: 'damage',
    featured: true,
    glyph: '⚡',
    status: 'active',
  },
  {
    name: 'RSENewLayout',
    slug: 'RSE-Layout-2026',
    category: 'overlay',
    tagline: 'Gen 3 Ruby/Sapphire/Emerald overlay, mid-port to macOS.',
    story:
      'The third overlay generation. All macOS-compatibility code, electron-builder packaging, and versioning are complete and pushed; the remaining fight is an NSIS installer bug on Windows ("failed creating mmap" on the .nsis.7z) — the kind of packaging archaeology that ships real desktop software.',
    highlights: [
      'Cross-platform electron-builder pipeline (Windows NSIS + macOS dmg)',
      'Trainer mapping being made data-driven from run logs rather than hand-maintained',
      'Roadmap: logging parity with RBYNewLayout, automatic markers, post-gym tier cards',
    ],
    stack: ['Electron', 'React', 'electron-builder', 'NSIS'],
    featured: false,
    glyph: '🔥',
    status: 'active',
  },
  {
    name: 'RBY-GameHook',
    slug: 'RBY-GameHook',
    category: 'systems',
    tagline: '.NET 8 emulator memory poller with its own auto-update infrastructure.',
    story:
      'A WPF host plus WebAPI that reads emulator memory through the PokeAByte shared-memory protocol and serves it to overlays at localhost:8085. The best war story in the stack: a mysterious "657 supporting files" distribution problem root-caused to `dotnet build` vs `dotnet publish` with PublishSingleFile — now both executables ship as true single-file self-contained binaries.',
    highlights: [
      'GameHook.WebAPI.exe: ~55 MB single-file self-contained binary, verified serving localhost:8085',
      'GameHook.WPF.exe: ~99 MB WebView2 shell, satellite-locale noise removed via SatelliteResourceLanguages=en plus a post-publish cleanup target',
      'Self-hosted AutoUpdater.NET XML feed at teoperalez.com/gamehook/AutoUpdater.xml, rewritten automatically by a publish-updater-xml job on every release',
      'First release (v0.0.0.0) built across Windows, Linux, and macOS in one workflow',
      'Companion teoperalez/mappers repo distributes memory maps as releases',
    ],
    stack: ['C#', '.NET 8', 'WPF', 'WebView2', 'GitHub Actions'],
    artifacts: ['localhost:8085', 'teoperalez.com/gamehook/AutoUpdater.xml'],
    demo: 'memory',
    featured: true,
    glyph: '🪝',
    status: 'shipped',
  },
  {
    name: 'AhShuckie',
    slug: 'AhShuckie',
    category: 'systems',
    tagline: 'Hard fork of a Rust Game Boy emulator, extended for programmatic replay capture.',
    story:
      'A hard fork of SnowyMouse/supershuckie (GPL-3.0 preserved). The upstream already speaks the PokeAByte UDP + shared-memory protocol on 127.0.0.1:55356 and exposes a REST API on :30158; the fork adds what overlays need — programmatic recording control, so a speedrun is captured as a deterministic replay the moment it starts.',
    highlights: [
      'NIDO/RINA replay file format: packet-based, zstd-compressed, with input-injection packets and save-state keyframes for deterministic playback',
      'REST endpoints: /stats, /go-to-frame, /set-paused, /set-playback-speed, /load-replay, /mark-start, /mark-end',
      'run_unlocked() mode pushes ~10× game speed — ≈600 fps for GB/GBC',
      'Phase plan: 600 Hz polling benchmark (P50/P99 jitter), POST /start-recording + /stop-recording, frame-aligned JSONL input logging, and POST /inject-input to regenerate lost runs from input logs',
    ],
    stack: ['Rust', 'zstd', 'REST', 'shared memory'],
    artifacts: ['127.0.0.1:55356 (UDP/shm)', '127.0.0.1:30158 (REST)'],
    demo: 'memory',
    featured: true,
    glyph: '🐚',
    status: 'active',
  },
  {
    name: 'IRLPC Hyperframes',
    slug: 'IRLPC-Hyperframes',
    category: 'ai',
    tagline: 'A 12-step LLM video pipeline that ends in a 4-track DaVinci Resolve timeline.',
    story:
      'An orchestration pipeline that turns raw footage into an edit-ready project: transcription → LLM A/B-roll classification → research → asset fetch → skeleton plan → section scripts → audit + clip mapping → HTML storyboard → human approval gate → clip rendering → FCPXML 1.11 → final edit in Resolve 20+. Cost-tiered by design: gpt-4o-mini does the bulk work, Claude Sonnet handles planning and strict audits.',
    highlights: [
      'A/B-roll classifier combines ffprobe loudness, Whisper speech presence, filename hints, and a gpt-4o-mini vision tiebreaker',
      'Approval gate is a React app served by Express on localhost:5173 — every audited line is its own approve/reject record, and rejected lines block rendering',
      'Clips capped at 30 s per section with automatic halving via the proven STEM_RANGE mechanism',
      'FCPXML 1.11 with four tracks: V1 Hyperframes graphics, V2 A-roll, V3 B-roll, A1 dialogue-only audio',
      'Assets auto-renamed aroll-NNN-slug / broll-NNN-slug, dry-run by default with --apply to commit',
    ],
    stack: ['Node.js', 'Express', 'React', 'Whisper', 'FFmpeg', 'FCPXML'],
    artifacts: ['localhost:5173 approval UI', 'FCPXML 1.11 / 4 tracks'],
    demo: 'pipeline',
    featured: true,
    glyph: '🎬',
    status: 'active',
  },
  {
    name: 'PokerSolver',
    slug: 'PokerSolver',
    category: 'tools',
    tagline: "Hold'em solver heading toward PioSolver-style strategy mapping.",
    story:
      'A solver project with an ambitious roadmap: map strategies and outputs the way PioSolver does, then run a background scheduler that solves every flop, turn, and river across chosen ranges — building a database of best lines for in-position and out-of-position play in 6-max and heads-up.',
    highlights: [
      'Strategy-tree mapping modeled on PioSolver output formats',
      'Background solve scheduler designed to fill the strategy database while the desk is idle',
      'IP/OOP best-line database covering 6-max and heads-up formats',
    ],
    stack: ['TypeScript', 'Monte-Carlo', 'hand evaluation'],
    demo: 'poker',
    featured: true,
    glyph: '♠️',
    status: 'active',
  },
  {
    name: 'bg-removal-hybrid',
    slug: 'bg-removal-hybrid',
    category: 'tools',
    tagline: 'Model + chroma hybrid background remover, one of a three-app CV suite.',
    story:
      'The first of three sibling apps (hybrid, review, touchup) covering the full background-removal workflow: automated first pass, fast batch human review, then manual fixes. The roadmap merges all three into one unified GUI.',
    highlights: [
      'Hybrid segmentation: model-based pass with a chroma-threshold fallback for stubborn edges',
      'bg-removal-review: keyboard-driven batch approve/reject GUI',
      'bg-removal-touchup: brush + threshold manual cleanup',
      'Unification into a single GUI is on the backlog as one coherent product',
    ],
    stack: ['Python', 'Canvas', 'CV'],
    featured: false,
    glyph: '✂️',
    status: 'active',
  },
  {
    name: 'bg-removal-review',
    slug: 'bg-removal-review',
    category: 'tools',
    tagline: 'Keyboard-first batch review GUI for segmentation output.',
    story: 'Sibling of bg-removal-hybrid: flip through masked images and approve or reject at typing speed.',
    highlights: ['Batch queue with single-keystroke verdicts', 'Feeds rejected frames to the touchup tool'],
    stack: ['Python', 'GUI'],
    featured: false,
    glyph: '👀',
    status: 'shipped',
  },
  {
    name: 'bg-removal-touchup',
    slug: 'bg-removal-touchup',
    category: 'tools',
    tagline: 'Manual mask cleanup with brush and threshold sliders.',
    story: 'The last mile of the CV suite: human-driven fixes where the model and chroma passes both fail.',
    highlights: ['Brush-based mask editing', 'Per-image threshold tuning'],
    stack: ['Python', 'GUI'],
    featured: false,
    glyph: '🖌️',
    status: 'shipped',
  },
  {
    name: 'TeoPeralez.com',
    slug: 'TeoPeralez.com',
    category: 'web',
    tagline: 'Personal Next.js site that doubles as release infrastructure.',
    story:
      'Live on Vercel, auto-deployed on push to main. Beyond the personal-site basics it serves a real production function: it hosts the GameHook AutoUpdater.xml feed under /gamehook/, which the RBY-GameHook release workflow rewrites on every release — the website is part of the desktop app\'s update path.',
    highlights: [
      'Hosts AutoUpdater.NET XML feed consumed by shipped desktop binaries',
      'Release workflow in a different repo commits updates to this one — cross-repo release choreography',
      'Channel hub connecting the music channel and other projects',
    ],
    stack: ['Next.js', 'Vercel'],
    artifacts: ['teoperalez.com/gamehook/AutoUpdater.xml'],
    featured: false,
    glyph: '🏠',
    status: 'shipped',
  },
  {
    name: 'GSC-Member-Picks',
    slug: 'GSC-Member-Picks',
    category: 'web',
    tagline: 'Live membership site for a Pokémon community — tierlists, status screens, downloads.',
    story:
      'A community product, not a toy: status screens for minimum-battles series, member tierlists, resources, and a free/paid download system for overlays and patch files. Challenge-request submission and tracking are in progress.',
    highlights: [
      'Free + paid download flows for overlay assets and patch files',
      'Minimum-battles series status screens',
      'Member tierlists and featured content',
      'Challenge-request submission/tracking pipeline in development',
    ],
    stack: ['Next.js', 'MongoDB Atlas'],
    featured: false,
    glyph: '🏆',
    status: 'shipped',
  },
  {
    name: 'RBY-Member-Picks',
    slug: 'RBY-Member-Picks',
    category: 'web',
    tagline: 'Sibling membership site for the RBY community, chasing GSC feature parity.',
    story: 'Live alongside GSC-Member-Picks; the backlog tracks bringing it to full parity: status screens, tierlists, resources, downloads.',
    highlights: ['Live in production', 'Feature-parity roadmap with the GSC site'],
    stack: ['Next.js', 'MongoDB Atlas'],
    featured: false,
    glyph: '🏅',
    status: 'shipped',
  },
  {
    name: 'pokemon-exp-calculator',
    slug: 'pokemon-exp-calculator',
    category: 'web',
    tagline: 'EXP curve and gain calculator for the classic growth groups.',
    story: 'A focused web tool: pick a growth group and level, see total EXP and EXP-to-next plotted across the curve.',
    highlights: ['All four classic growth-rate formulas', 'Canvas-plotted curves'],
    stack: ['Web', 'Canvas'],
    demo: 'exp',
    featured: false,
    glyph: '📈',
    status: 'shipped',
  },
  {
    name: 'FileOrganizer',
    slug: 'FileOrganizer',
    category: 'tools',
    tagline: 'Video transcription + LLM metadata tagging for a chaotic footage library.',
    story:
      'Batch video transcription with background processing, then a low-cost LLM writes metadata into each file, groups videos that belong to the same project, and renames them into a coherent scheme.',
    highlights: [
      'Background batch transcription for large video sets',
      'LLM-driven metadata writing, project grouping, and renaming',
    ],
    stack: ['Node.js', 'Whisper', 'LLM'],
    featured: false,
    glyph: '🗃️',
    status: 'active',
  },
  {
    name: 'YTBiz',
    slug: 'YTBiz',
    category: 'tools',
    tagline: 'Productivity logger keyed to actual creative-work signals.',
    story:
      'Logs working time per project triggered by real activity — a live overlay run starting, DaVinci Resolve launching — with mouse/keystroke tracking to detect time away from the desk.',
    highlights: [
      'Work sessions auto-attributed to projects by which tools are running',
      'Away-from-desk detection via input tracking',
    ],
    stack: ['Node.js', 'Windows APIs'],
    featured: false,
    glyph: '⏱️',
    status: 'active',
  },
  {
    name: 'Discord Bot',
    slug: 'Discord-Bot',
    category: 'tools',
    tagline: 'Community Discord bot, functional and heading to free-tier hosting.',
    story: 'A working community bot; current work is evaluating free deployment targets (Railway, Render, Replit) and standing up a deployment pipeline.',
    highlights: ['Functional command set', 'Deployment pipeline evaluation in progress'],
    stack: ['Node.js', 'discord.js'],
    featured: false,
    glyph: '🤖',
    status: 'active',
  },
  {
    name: 'EarningsAnalyticsAggregator',
    slug: 'EarningsAnalyticsAggregator',
    category: 'tools',
    tagline: 'Multi-platform earnings scraper and normalizer.',
    story: 'Pulls earnings data from multiple platforms into one normalized view.',
    highlights: ['Cross-platform ETL into a single dashboard'],
    stack: ['Node.js', 'ETL'],
    featured: false,
    glyph: '📊',
    status: 'shipped',
  },
  {
    name: 'DailyMembersUpdater',
    slug: 'DailyMembersUpdater',
    category: 'tools',
    tagline: 'Daily cron that reconciles member lists across platforms.',
    story: 'Quiet infrastructure: a scheduled job that keeps paying-member lists in sync.',
    highlights: ['Diff-and-apply sync, runs daily unattended'],
    stack: ['Node.js', 'cron'],
    featured: false,
    glyph: '🔁',
    status: 'shipped',
  },
  {
    name: 'Emerald Rom Builder',
    slug: 'Emerald-Rom-Builder',
    category: 'rom',
    tagline: 'Build pipeline for Pokémon Emerald ROM hacks.',
    story:
      'Part of a broader ROM-hacking practice that includes competitive-moveset ROMs (movesets fetched from Smogon and injected per-Pokémon), gym-leader team ROMs, and patches like removing all spinning trainers from pokecrystal.',
    highlights: [
      'Scripted GBA ROM builds',
      'Sibling efforts: competitive moveset ROMs for Crystal/Emerald/Ruby/FireRed, pokecrystal gym-leader ROMs, spinning-trainer removal patch',
    ],
    stack: ['GBA', 'asm', 'build tooling'],
    featured: false,
    glyph: '💎',
    status: 'active',
  },
  {
    name: 'resolve-mcp',
    slug: 'resolve-mcp',
    category: 'tools',
    tagline: 'Model Context Protocol server for DaVinci Resolve.',
    story: 'Lets AI agents drive Resolve directly — the natural endpoint of the Hyperframes pipeline, where the generated FCPXML meets an agent that can manipulate the edit.',
    highlights: ['MCP server exposing Resolve operations to agents'],
    stack: ['Node.js', 'MCP', 'DaVinci Resolve API'],
    featured: false,
    glyph: '🎞️',
    status: 'active',
  },
  {
    name: 'gemma-agent',
    slug: 'gemma-agent',
    category: 'ai',
    tagline: 'Local LLM agent experiments — offline tool use.',
    story: 'Agent workflows running against local models, no API dependency.',
    highlights: ['Local-first agent loop', 'Offline tool use experiments'],
    stack: ['Python', 'local LLM'],
    featured: false,
    glyph: '🧠',
    status: 'active',
  },
  {
    name: 'PokemonOfficialArtwork',
    slug: 'PokemonOfficialArtwork',
    category: 'tools',
    tagline: 'Asset pipeline feeding the overlay family.',
    story: 'Naming, hashing, and deduping the artwork assets the overlays consume.',
    highlights: ['Deterministic asset naming + dedupe'],
    stack: ['Node.js'],
    featured: false,
    glyph: '🎨',
    status: 'shipped',
  },
  {
    name: 'FamilyMedia',
    slug: 'FamilyMedia',
    category: 'tools',
    tagline: 'Personal media library organizer.',
    story: 'EXIF-driven sorting, folder rules, and deduplication for family photos and video.',
    highlights: ['EXIF sort + dedupe rules'],
    stack: ['Python'],
    featured: false,
    glyph: '📷',
    status: 'shipped',
  },
  {
    name: 'MSCS',
    slug: 'MSCS',
    category: 'tools',
    tagline: "Master's coursework — algorithms, OS, ML.",
    story: 'Graduate CS coursework repository.',
    highlights: ['Algorithms, operating systems, machine learning projects'],
    stack: ['Python', 'C'],
    featured: false,
    glyph: '🎓',
    status: 'shipped',
  },
  {
    name: 'GSCNewLayout (test branch)',
    slug: 'GSCNewLayout',
    category: 'overlay',
    tagline: 'Active test branch of the Gen 2 overlay.',
    story: 'The GSC overlay tracks a test branch in the workspace manifest for pre-release verification.',
    highlights: ['Manifest pins branch: test for staging changes'],
    stack: ['Electron', 'React'],
    featured: false,
    glyph: '🧪',
    status: 'active',
  },
  {
    name: 'RBYNewLayout-components',
    slug: 'RBY-Layout-2026',
    category: 'overlay',
    tagline: 'The refactor/componentize branch — the Gen 1 overlay decomposed.',
    story: 'A live refactor splitting the original overlay monolith into reusable components, tracked as its own working folder against the refactor/componentize branch.',
    highlights: ['Component extraction from a shipped Electron app without breaking runs'],
    stack: ['React', 'TypeScript'],
    featured: false,
    glyph: '🧩',
    status: 'active',
  },
];

export const FEATURED = PROJECTS.filter((p) => p.featured);

export const CATEGORY_LABELS: Record<Category, string> = {
  overlay: 'Speedrun overlays',
  systems: 'Systems / native',
  ai: 'AI & pipelines',
  web: 'Web',
  rom: 'ROM hacking',
  tools: 'Tools',
};

export const CONTACT = {
  name: 'Teo Peralez',
  role: 'Frontend engineer — open to work',
  email: 'teoperalez@gmail.com',
  github: 'https://github.com/teoperalez',
  site: 'https://teoperalez.com',
};

/** The 12 Hyperframes pipeline steps, real ordering from REVISED_PIPELINE.md */
export const PIPELINE_STEPS = [
  { n: 1, name: 'transcribe', tool: 'whisper.cpp', out: 'transcribe.json' },
  { n: 2, name: 'classify A/B-roll', tool: 'gpt-4o-mini + ffprobe loudness + filename hints', out: 'inventory.json' },
  { n: 3, name: 'research', tool: 'gpt-4o-mini', out: 'tidbits.md' },
  { n: 4, name: 'fetch assets', tool: 'Pexels + Openverse', out: 'assets/*' },
  { n: 5, name: 'skeleton plan', tool: 'Claude Sonnet 4.6 (interactive Q&A)', out: 'skeleton-plan.md' },
  { n: 6, name: 'section scripts', tool: 'gpt-4o-mini', out: 'scripts/*.md' },
  { n: 7, name: 'audit + clip map', tool: 'Claude Sonnet 4.6 --strict', out: 'clip-map.json' },
  { n: 8, name: 'storyboard', tool: 'HTML node-graph + Hyperframes iframes', out: 'storyboard.html' },
  { n: 9, name: 'approval gate', tool: 'React + Express @ localhost:5173', out: 'per-line approve/reject' },
  { n: 10, name: 'render clips', tool: 'FFmpeg, ≤30 s caps, auto-halving', out: 'clips/*.mp4' },
  { n: 11, name: 'build FCPXML', tool: 'FCPXML 1.11 — V1 HF / V2 A-roll / V3 B-roll / A1 dialogue', out: 'project.fcpxml' },
  { n: 12, name: 'final edit', tool: 'DaVinci Resolve 20+', out: 'final.mov' },
] as const;
