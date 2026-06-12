/**
 * Per-project dialog content used by both the dialog box and the full
 * project panel. Sourced from lib/projects but trimmed/dramatised.
 */

import { PROJECTS, type Project } from '@/lib/projects';

export interface BuildingDialog {
  /** opening lines shown in the dialog box on first step inside. */
  intro: string[];
  /** Panel content (heading copy + sections); rendered by ui/Panel. */
  project: Project | null;
  /** Whether stepping inside this building offers a boss battle. */
  hasBattle?: boolean;
  /** Whether this building offers a mini-game (e.g. poker). */
  hasMini?: 'poker' | null;
}

function find(name: string): Project {
  const p = PROJECTS.find((x) => x.name === name);
  if (!p) throw new Error('missing project: ' + name);
  return p;
}

export const HOUSE_INTRO: string[] = [
  "TEO'S HOUSE",
  "Frontend engineer. Polyglot by necessity, not by choice.",
  "26 shipped repos. Open to FAANG-tier frontend roles, remote-friendly.",
  "TIP: Press TAB any time to switch to a fully-readable text view.",
];

export const ARCHIVE_INTRO: string[] = [
  "THE ARCHIVE",
  "Every shipped repo, in one room.",
  "The boring building. Also the honest one.",
];

export const CONTACT_INTRO: string[] = [
  "CONTACT TOWER",
  "If your product has a hot loop and you need a frontend that can render it,",
  "press SPACE again — and the elevator opens to my inbox.",
];

export const DIALOGS: Record<string, BuildingDialog> = {
  GSCNewLayout: {
    intro: [
      "OVERLAY ARENA",
      "Gen 2 Pokémon speedrun overlay.",
      "The damage calculator is wired to handle weather, screens, burn, badges,",
      "STAB, type effectiveness, semi-invuln double damage, and Hidden Power.",
      "Want a fight?",
    ],
    project: find('GSCNewLayout'),
    hasBattle: true,
  },
  'RBY-GameHook': {
    intro: [
      "GAMEHOOK ROOFTOP",
      "WPF + WebAPI memory poller. .NET 8 single-file binaries.",
      "Self-hosted AutoUpdater feed on teoperalez.com.",
      "The 55 MB file inside used to be 657 files. Ask me why.",
    ],
    project: find('RBY-GameHook'),
  },
  'IRLPC Hyperframes': {
    intro: [
      "HYPERFRAMES STUDIO",
      "Twelve LLM steps. One human gate. One DaVinci Resolve project file.",
      "GPT-4o-mini for bulk. Claude Sonnet for plan and strict audit.",
      "Inside: scroll to watch the full pipeline run.",
    ],
    project: find('IRLPC Hyperframes'),
  },
  AhShuckie: {
    intro: [
      "AHSHUCKIE LAB",
      "Rust emulator fork (GPL-3 preserved).",
      "Deterministic replay format. REST API. 10× unlocked-speed mode.",
      "Boss inside teaches type effectiveness.",
    ],
    project: find('AhShuckie'),
    hasBattle: true,
  },
  PokerSolver: {
    intro: [
      "POKER ROOM",
      "Hold'em solver. Browser-sized Monte-Carlo at 30k boards.",
      "Sit down — deal two hands — watch equity converge.",
    ],
    project: find('PokerSolver'),
    hasMini: 'poker',
  },
};
