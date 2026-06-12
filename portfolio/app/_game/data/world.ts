/**
 * Programming Town — the explorable world.
 *
 * The map is built programmatically: start from a base of grass, scatter
 * decoration, frame in trees, lay paths between plots. 50×36 tiles.
 */

import type { TilemapDef } from '../engine/Tilemap';
import type { TileID } from '../engine/Assets';

export const WORLD_W = 50;
export const WORLD_H = 36;

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildMap(): TilemapDef {
  const N = WORLD_W * WORLD_H;
  const ground: TileID[] = new Array<TileID>(N).fill('grass');
  const solid: boolean[] = new Array<boolean>(N).fill(false);
  const idx = (x: number, y: number) => y * WORLD_W + x;
  const r = rng(7);

  // grass texture variation
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const v = r();
      if (v < 0.05) ground[idx(x, y)] = 'grass-tuft';
      else if (v < 0.075) ground[idx(x, y)] = 'grass-flower';
      else if (v < 0.10) ground[idx(x, y)] = 'grass-dark';
    }
  }

  // border of trees
  for (let x = 0; x < WORLD_W; x++) {
    ground[idx(x, 0)] = 'tree'; solid[idx(x, 0)] = true;
    ground[idx(x, WORLD_H - 1)] = 'tree'; solid[idx(x, WORLD_H - 1)] = true;
  }
  for (let y = 0; y < WORLD_H; y++) {
    ground[idx(0, y)] = 'tree'; solid[idx(0, y)] = true;
    ground[idx(WORLD_W - 1, y)] = 'tree'; solid[idx(WORLD_W - 1, y)] = true;
  }

  // scattered trees inside the playable area (avoid path corridors)
  const treeSpots: Array<[number, number]> = [
    [2, 2], [3, 4], [4, 2], [6, 3], [8, 5],
    [44, 4], [46, 3], [42, 5], [47, 7],
    [3, 31], [5, 32], [2, 29],
    [45, 32], [47, 30], [43, 33], [46, 28],
    [10, 32], [11, 31], [37, 32], [38, 31],
    [4, 14], [4, 15], [5, 20], [3, 23],
    [46, 14], [46, 18], [45, 22],
  ];
  for (const [tx, ty] of treeSpots) {
    if (tx > 0 && tx < WORLD_W - 1 && ty > 0 && ty < WORLD_H - 1) {
      ground[idx(tx, ty)] = 'tree';
      solid[idx(tx, ty)] = true;
    }
  }

  // rocks
  const rockSpots: Array<[number, number]> = [[7, 30], [42, 12], [9, 7], [43, 27], [6, 22]];
  for (const [tx, ty] of rockSpots) {
    ground[idx(tx, ty)] = 'rock';
    solid[idx(tx, ty)] = true;
  }

  // paths — a cross through the center, lanes connecting building plots
  const layPath = (x0: number, y0: number, x1: number, y1: number) => {
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
    const ya = Math.min(y0, y1), yb = Math.max(y0, y1);
    for (let yy = ya; yy <= yb; yy++) {
      for (let xx = xa; xx <= xb; xx++) {
        ground[idx(xx, yy)] = 'path';
        solid[idx(xx, yy)] = false;
      }
    }
  };

  // central N-S avenue
  layPath(24, 1, 25, WORLD_H - 2);
  // central E-W avenue (player house row)
  layPath(1, 17, WORLD_W - 2, 18);
  // upper plaza E-W
  layPath(10, 10, 36, 11);
  // lower plaza E-W
  layPath(10, 25, 36, 26);
  // archive offshoot
  layPath(36, 17, 42, 18);

  // small approach paths to each building entrance (door is bottom-center)
  // Each building sits on tile (tx,ty) — door is at (tx + half - 1 .. tx + half) on row ty + h - 1
  const buildingApproach = (tx: number, ty: number, bw: number, bh: number) => {
    const doorCx = tx + Math.floor(bw / 2);
    for (let dy = ty + bh; dy < ty + bh + 3; dy++) {
      if (dy >= WORLD_H - 1) break;
      ground[idx(doorCx - 1, dy)] = 'path';
      ground[idx(doorCx, dy)] = 'path';
      solid[idx(doorCx - 1, dy)] = false;
      solid[idx(doorCx, dy)] = false;
    }
  };
  // Building footprints (declared in BUILDINGS below) need their plots cleared
  // of grass clutter and their approach paths laid. We do that after stamping.

  return { w: WORLD_W, h: WORLD_H, ground, solid };
}

export const TILEMAP = buildMap();

/** Player spawn — south of TEO'S HOUSE, on the central N-S path. */
export const SPAWN = { tx: 24, ty: 17 };

/* ---- buildings ---- */
export interface BuildingPlacement {
  id: string;
  sprite: string;
  tx: number;
  ty: number;
  bw: number; // tile width
  bh: number; // tile height
  label: string;
  sublabel?: string;
  projectId: string;
}

export const BUILDINGS: BuildingPlacement[] = [
  // top row (north of center, on upper plaza)
  { id: 'b-overlay', sprite: 'bld-overlay', tx: 8, ty: 5, bw: 6, bh: 5, label: 'OVERLAY ARENA', sublabel: 'GSCNewLayout', projectId: 'GSCNewLayout' },
  { id: 'b-gamehook', sprite: 'bld-gamehook', tx: 22, ty: 5, bw: 6, bh: 5, label: 'GAMEHOOK', sublabel: '.NET 8 / 600 Hz', projectId: 'RBY-GameHook' },
  { id: 'b-hyperframes', sprite: 'bld-hyperframes', tx: 36, ty: 5, bw: 6, bh: 5, label: 'HYPERFRAMES', sublabel: 'AI / 12 steps', projectId: 'IRLPC Hyperframes' },
  // your house — slightly right of plaza center
  { id: 'b-house', sprite: 'bld-house', tx: 27, ty: 12, bw: 5, bh: 5, label: "TEO'S HOUSE", sublabel: 'about / start', projectId: 'house' },
  // bottom row
  { id: 'b-ahshuckie', sprite: 'bld-ahshuckie', tx: 8, ty: 20, bw: 6, bh: 5, label: 'AHSHUCKIE LAB', sublabel: 'Rust / emu fork', projectId: 'AhShuckie' },
  { id: 'b-poker', sprite: 'bld-poker', tx: 22, ty: 20, bw: 6, bh: 5, label: 'POKER ROOM', sublabel: 'PokerSolver', projectId: 'PokerSolver' },
  { id: 'b-contact', sprite: 'bld-contact', tx: 36, ty: 19, bw: 6, bh: 6, label: 'CONTACT TOWER', sublabel: "let's work", projectId: 'contact' },
  // far east — archive
  { id: 'b-archive', sprite: 'bld-archive', tx: 42, ty: 12, bw: 8, bh: 5, label: 'THE ARCHIVE', sublabel: 'all 26 repos', projectId: 'archive' },
];

/* Now stamp approach paths for each building (centered door, two tiles down). */
(() => {
  for (const b of BUILDINGS) {
    const doorCx = b.tx + Math.floor(b.bw / 2);
    for (let dy = b.ty + b.bh; dy < b.ty + b.bh + 3; dy++) {
      if (dy >= WORLD_H - 1) break;
      const i1 = dy * WORLD_W + (doorCx - 1);
      const i2 = dy * WORLD_W + doorCx;
      // overwrite to path
      TILEMAP.ground[i1] = 'path';
      TILEMAP.ground[i2] = 'path';
      TILEMAP.solid[i1] = false;
      TILEMAP.solid[i2] = false;
    }
  }
})();

/* ---- NPCs ---- */
export interface NPCPlacement {
  id: string;
  sprite: string;
  tx: number;
  ty: number;
  label: string;
  facing?: 'up' | 'down' | 'left' | 'right';
  patrol?: Array<{ tx: number; ty: number }>;
  lines: string[];
  flag?: string;
}

export const NPCS: NPCPlacement[] = [
  {
    id: 'npc-greeter',
    sprite: 'npc-overlay',
    tx: 23,
    ty: 18,
    label: 'GREETER',
    facing: 'down',
    lines: [
      "Welcome to Programming Town.",
      "WASD or arrow keys to walk. SPACE near a building or NPC to interact.",
      "TAB for a text-only view. M for menu. Backtick for the dev console.",
    ],
    flag: 'met-greeter',
  },
  {
    id: 'npc-runner',
    sprite: 'npc-gamehook',
    tx: 18,
    ty: 11,
    label: 'SPEEDRUNNER',
    patrol: [
      { tx: 18, ty: 11 }, { tx: 22, ty: 11 }, { tx: 22, ty: 17 }, { tx: 18, ty: 17 },
    ],
    lines: [
      "The Overlay Arena runs the actual Gen 2 damage formula.",
      "STAB, screens, weather, burn, badges, Hidden Power — every modifier.",
      "Step inside and battle the gym leader.",
    ],
  },
  {
    id: 'npc-orchestrator',
    sprite: 'npc-hyperframes',
    tx: 34,
    ty: 11,
    label: 'PIPELINE ORCHESTRATOR',
    patrol: [
      { tx: 34, ty: 11 }, { tx: 37, ty: 11 }, { tx: 37, ty: 17 }, { tx: 34, ty: 17 },
    ],
    lines: [
      "Hyperframes orchestrates twelve LLM steps.",
      "GPT-4o-mini does the bulk. Claude Sonnet handles plan and strict audit.",
      "A human approves every line — rejects block render.",
    ],
  },
  {
    id: 'npc-poker',
    sprite: 'npc-poker',
    tx: 24,
    ty: 27,
    label: 'CASINO REGULAR',
    patrol: [
      { tx: 24, ty: 27 }, { tx: 27, ty: 27 },
    ],
    lines: [
      "PokerSolver runs Monte-Carlo equity in your browser tab.",
      "Step into the Poker Room. Deal two hands. Watch the curve converge.",
    ],
  },
  {
    id: 'npc-archivist',
    sprite: 'npc-ahshuckie',
    tx: 41,
    ty: 18,
    label: 'ARCHIVIST',
    facing: 'left',
    lines: [
      "All 26 shipped repos live in the Archive.",
      "It's the boring building. It's also the honest one.",
    ],
  },
];
