# portfolio/ — four-version interactive portfolio (Next.js)

One Next.js app, four completely distinct portfolio "rooms" over the same
26-repo dataset. No shared styles or layouts between versions — only the
data layer (`lib/projects.ts`) and demo math (`lib/pokemon.ts`,
`lib/poker.ts`) are shared.

| Route | Aesthetic | Signature interactions |
| --- | --- | --- |
| `/` | Chooser | Keyboard 1–4 jumps into a version |
| `/v1-terminal` | Brutalist CRT shell | Working REPL (`cat <project>`, `ports`, `warstories`, history), damage calc, Monte-Carlo poker, 600 Hz memory tap |
| `/v2-editorial` | Print magazine | Damage "specimen" infographic, real postmortem columns, annotated SVG architecture |
| `/v3-tradingcard` | Holo card binder | 26 flippable cards w/ rarity tiers, evolution line, per-card demos |
| `/v4-desktop` | macOS-style desktop | Window manager, Finder w/ preview pane, Terminal, Pipeline.app, Notes.app, Activity Monitor |

## Local dev

```bash
cd portfolio
npm install
npm run dev      # http://localhost:3000
```

## Production build (what GitHub Pages runs)

```bash
npm run build                          # static export to out/
PAGES_BASE_PATH=/Programming npm run build   # exactly what CI does
npx serve out                          # optional: preview the export
```

Deployment is automated by `.github/workflows/pages.yml`: on push it
builds the static export with `PAGES_BASE_PATH=/Programming` and publishes
`portfolio/out` to GitHub Pages.

## Where the content lives

- `lib/projects.ts` — every project, with real facts sourced from the
  meta-repo's `TODO.md` / `repos.json`. Edit here; all four versions update.
- `lib/pokemon.ts` — the Gen 2-style damage formula the demos share.
- `lib/poker.ts` — 7-card evaluator + Monte-Carlo equity loop.
- `../PORTFOLIO_IDEAS.md` — the manifest of per-project ideas for making
  each repo more compelling as a portfolio piece.
