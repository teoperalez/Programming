/**
 * Programming Town — production-pass world build.
 *
 * Built programmatically: base grass with seeded variation, dense tree
 * border, water pond at the east edge, paved central plaza around a
 * fountain, gravel paths radiating to each building, decorative trees
 * scattered inside the playable area as walk-behind entities.
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
  const r = rng(13);

  // grass mottling: near-identical variants for soft texture, plus sparse
  // tall-grass / flower / mossy-patch accents that cluster rather than speckle
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const v = r();
      if (v < 0.22) ground[idx(x, y)] = 'grass-2';
      else if (v < 0.40) ground[idx(x, y)] = 'grass-3';
      else if (v < 0.425) ground[idx(x, y)] = 'grass-dark';
      else if (v < 0.44) ground[idx(x, y)] = 'flower';
    }
  }
  // tall-grass clusters (deliberate patches, not random speckle)
  const tallPatches: Array<[number, number]> = [
    [14, 8], [30, 7], [6, 28], [44, 24], [16, 30], [33, 29], [40, 8],
  ];
  for (const [cx, cy] of tallPatches) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (r() < 0.4) continue;
        const xx = cx + dx, yy = cy + dy;
        if (xx > 1 && yy > 1 && xx < WORLD_W - 2 && yy < WORLD_H - 2) {
          ground[idx(xx, yy)] = 'tallgrass';
        }
      }
    }
  }

  // dirt path with proper edge tiles
  type Side = 'n' | 's' | 'e' | 'w';
  const layPath = (x0: number, y0: number, x1: number, y1: number) => {
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
    const ya = Math.min(y0, y1), yb = Math.max(y0, y1);
    for (let yy = ya; yy <= yb; yy++) {
      for (let xx = xa; xx <= xb; xx++) {
        const i = idx(xx, yy);
        ground[i] = 'path';
        solid[i] = false;
      }
    }
  };
  const edge = (xx: number, yy: number, side: Side) => {
    if (xx < 0 || yy < 0 || xx >= WORLD_W || yy >= WORLD_H) return;
    const i = idx(xx, yy);
    if (ground[i] === 'path') return;
    ground[i] = (`path-edge-${side}`) as TileID;
    solid[i] = false;
  };

  // Central plaza (cobblestone) around the fountain
  for (let y = 16; y <= 22; y++) {
    for (let x = 22; x <= 28; x++) {
      const i = idx(x, y);
      ground[i] = (x + y) % 2 === 0 ? 'cobble' : 'cobble-2';
      solid[i] = false;
    }
  }

  // Central N–S avenue (north gate → plaza → south gate)
  layPath(24, 1, 25, 15);
  layPath(24, 23, 25, WORLD_H - 2);
  // E–W avenue through plaza
  layPath(1, 18, 21, 19);
  layPath(29, 18, WORLD_W - 9, 19);

  // Upper E–W plaza road (in front of upper buildings)
  layPath(10, 10, 36, 11);
  // Lower E–W plaza road
  layPath(10, 25, 36, 26);
  // Archive offshoot
  layPath(36, 18, 42, 19);

  // path-edge softening (one-pass)
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const i = idx(x, y);
      if (ground[i] !== 'path') continue;
      // for each cardinal neighbour that isn't path/cobble/edge, paint edge
      if (y > 0 && ground[idx(x, y - 1)] !== 'path' && !ground[idx(x, y - 1)].startsWith('cobble') && !ground[idx(x, y - 1)].startsWith('path-edge')) edge(x, y - 1, 's');
      if (y < WORLD_H - 1 && ground[idx(x, y + 1)] !== 'path' && !ground[idx(x, y + 1)].startsWith('cobble') && !ground[idx(x, y + 1)].startsWith('path-edge')) edge(x, y + 1, 'n');
      if (x > 0 && ground[idx(x - 1, y)] !== 'path' && !ground[idx(x - 1, y)].startsWith('cobble') && !ground[idx(x - 1, y)].startsWith('path-edge')) edge(x - 1, y, 'e');
      if (x < WORLD_W - 1 && ground[idx(x + 1, y)] !== 'path' && !ground[idx(x + 1, y)].startsWith('cobble') && !ground[idx(x + 1, y)].startsWith('path-edge')) edge(x + 1, y, 'w');
    }
  }

  // Water pond in the lower-right corner (decorative, not blocking the contact tower)
  for (let y = 30; y <= 33; y++) {
    for (let x = 45; x <= 48; x++) {
      const i = idx(x, y);
      ground[i] = 'water';
      solid[i] = true;
    }
  }
  // pond shore (edge tiles)
  const shoreFor = (xx: number, yy: number) => {
    if (xx < 0 || yy < 0 || xx >= WORLD_W || yy >= WORLD_H) return;
    const i = idx(xx, yy);
    if (ground[i] === 'water') return;
    if (ground[i].startsWith('path')) return;
    // pick which side
    const hasWN = yy > 0 && ground[idx(xx, yy - 1)] === 'water';
    const hasWS = yy < WORLD_H - 1 && ground[idx(xx, yy + 1)] === 'water';
    const hasWE = xx < WORLD_W - 1 && ground[idx(xx + 1, yy)] === 'water';
    const hasWW = xx > 0 && ground[idx(xx - 1, yy)] === 'water';
    if (hasWS) ground[i] = 'water-edge-n';
    else if (hasWN) ground[i] = 'water-edge-s';
    else if (hasWE) ground[i] = 'water-edge-w';
    else if (hasWW) ground[i] = 'water-edge-e';
    else ground[i] = 'sand';
  };
  for (let y = 29; y <= 34; y++) for (let x = 44; x <= 49; x++) shoreFor(x, y);

  // tree perimeter (thick wood frame, two rings)
  for (let x = 0; x < WORLD_W; x++) {
    solid[idx(x, 0)] = true;
    solid[idx(x, WORLD_H - 1)] = true;
  }
  for (let y = 0; y < WORLD_H; y++) {
    solid[idx(0, y)] = true;
    solid[idx(WORLD_W - 1, y)] = true;
  }

  // rocks scattered
  const rockSpots: Array<[number, number]> = [[7, 30], [42, 12], [9, 7], [6, 31], [43, 27]];
  for (const [tx, ty] of rockSpots) {
    if (ground[idx(tx, ty)] === 'grass' || ground[idx(tx, ty)].startsWith('grass')) {
      ground[idx(tx, ty)] = 'rock';
      solid[idx(tx, ty)] = true;
    }
  }

  // fences along the central plaza E-W edges (decorative)
  for (let x = 23; x <= 27; x++) {
    if (ground[idx(x, 15)] === 'cobble' || ground[idx(x, 15)] === 'cobble-2') continue;
    // skip
  }

  return { w: WORLD_W, h: WORLD_H, ground, solid };
}

export const TILEMAP = buildMap();

/** Player spawn — on the central plaza, just south of the fountain. */
export const SPAWN = { tx: 24, ty: 20 };

/* ============================================================ */
/* Walk-behind decorations (trees, fountain, beacon)            */
/* ============================================================ */

export interface TreePlacement {
  tx: number;
  ty: number;
  kind: 'round' | 'pine';
}

export const TREES: TreePlacement[] = [
  // dense ring just inside the world border (lines 1–2 + WORLD_H-3..H-2)
  // top edge
  ...gen([
    [2, 1], [4, 1], [6, 1], [8, 1], [10, 1], [12, 1],
    [38, 1], [40, 1], [42, 1], [44, 1], [46, 1],
    [1, 2], [3, 2], [5, 2], [7, 2], [9, 2],
    [37, 2], [39, 2], [41, 2], [43, 2], [45, 2], [47, 2],
    [2, 3], [16, 1], [18, 1], [20, 1], [22, 1], [28, 1], [30, 1], [32, 1], [34, 1],
  ], 'round'),
  // bottom edge (clear of central avenue and pond)
  ...gen([
    [2, 32], [4, 32], [6, 32], [8, 32], [10, 32], [12, 32],
    [14, 32], [16, 32], [20, 32], [28, 32], [30, 32], [32, 32], [34, 32],
    [37, 32], [39, 32], [42, 32], [44, 32],
    [3, 33], [5, 33], [11, 33], [13, 33], [33, 33], [35, 33], [41, 33],
  ], 'pine'),
  // left edge
  ...gen([
    [1, 5], [1, 7], [1, 9], [1, 11], [1, 13], [1, 15], [1, 21], [1, 23], [1, 25], [1, 27], [1, 30],
    [2, 6], [2, 8], [2, 14], [2, 22], [2, 26], [2, 28],
  ], 'round'),
  // right edge (skip pond area y=29..34)
  ...gen([
    [48, 5], [48, 7], [48, 9], [48, 11], [48, 13], [48, 15], [48, 17], [48, 23], [48, 25], [48, 27],
    [47, 6], [47, 8], [47, 12], [47, 24], [47, 26],
  ], 'pine'),
  // scattered interior trees as landscape
  { tx: 4, ty: 15, kind: 'round' }, { tx: 4, ty: 22, kind: 'pine' },
  { tx: 5, ty: 20, kind: 'round' },
  { tx: 16, ty: 13, kind: 'round' }, { tx: 32, ty: 13, kind: 'pine' },
  { tx: 17, ty: 22, kind: 'pine' }, { tx: 33, ty: 22, kind: 'round' },
  { tx: 41, ty: 22, kind: 'pine' }, { tx: 41, ty: 9, kind: 'round' },
];

function gen(coords: Array<[number, number]>, kind: 'round' | 'pine'): TreePlacement[] {
  return coords.map(([tx, ty]) => ({ tx, ty, kind }));
}

export interface FountainPlacement {
  tx: number;
  ty: number;
}

export const FOUNTAIN: FountainPlacement = { tx: 24, ty: 18 };

/* decorative props: lamps (with glow), bushes, flower beds */
export interface PropPlacement {
  sprite: 'lamp' | 'bush' | 'bush-berry' | 'flowerbed';
  tx: number;
  ty: number;
  glow?: number;
  solid?: boolean;
}

export const PROPS: PropPlacement[] = [
  // lamp posts framing the plaza corners + along the central avenue
  { sprite: 'lamp', tx: 21, ty: 16, glow: 26, solid: true },
  { sprite: 'lamp', tx: 28, ty: 16, glow: 26, solid: true },
  { sprite: 'lamp', tx: 21, ty: 22, glow: 26, solid: true },
  { sprite: 'lamp', tx: 28, ty: 22, glow: 26, solid: true },
  { sprite: 'lamp', tx: 23, ty: 9, glow: 24, solid: true },
  { sprite: 'lamp', tx: 26, ty: 25, glow: 24, solid: true },
  // flower beds flanking key doors
  { sprite: 'flowerbed', tx: 9, ty: 10 },
  { sprite: 'flowerbed', tx: 13, ty: 10 },
  { sprite: 'flowerbed', tx: 23, ty: 10 },
  { sprite: 'flowerbed', tx: 27, ty: 10 },
  { sprite: 'flowerbed', tx: 37, ty: 10 },
  { sprite: 'flowerbed', tx: 41, ty: 10 },
  // bushes scattered to fill grass
  { sprite: 'bush-berry', tx: 5, ty: 17, solid: true },
  { sprite: 'bush', tx: 6, ty: 18, solid: true },
  { sprite: 'bush', tx: 18, ty: 14, solid: true },
  { sprite: 'bush-berry', tx: 31, ty: 14, solid: true },
  { sprite: 'bush', tx: 19, ty: 23, solid: true },
  { sprite: 'bush-berry', tx: 30, ty: 23, solid: true },
  { sprite: 'bush', tx: 43, ty: 20, solid: true },
  { sprite: 'bush', tx: 15, ty: 28, solid: true },
  { sprite: 'bush-berry', tx: 34, ty: 28, solid: true },
];

/* ============================================================ */
/* Buildings                                                    */
/* ============================================================ */

export interface BuildingPlacement {
  id: string;
  sprite: string;
  tx: number;
  ty: number;
  bw: number;
  bh: number;
  label: string;
  sublabel?: string;
  projectId: string;
}

export const BUILDINGS: BuildingPlacement[] = [
  { id: 'b-overlay', sprite: 'bld-overlay', tx: 8, ty: 5, bw: 6, bh: 5, label: 'OVERLAY ARENA', sublabel: 'GSCNewLayout', projectId: 'GSCNewLayout' },
  { id: 'b-gamehook', sprite: 'bld-gamehook', tx: 22, ty: 5, bw: 6, bh: 5, label: 'GAMEHOOK', sublabel: '.NET 8 / 600 Hz', projectId: 'RBY-GameHook' },
  { id: 'b-hyperframes', sprite: 'bld-hyperframes', tx: 36, ty: 5, bw: 6, bh: 5, label: 'HYPERFRAMES', sublabel: 'AI / 12 steps', projectId: 'IRLPC Hyperframes' },
  { id: 'b-house', sprite: 'bld-house', tx: 9, ty: 12, bw: 5, bh: 5, label: "TEO'S HOUSE", sublabel: 'about / start', projectId: 'house' },
  { id: 'b-ahshuckie', sprite: 'bld-ahshuckie', tx: 8, ty: 22, bw: 6, bh: 5, label: 'AHSHUCKIE LAB', sublabel: 'Rust / emu fork', projectId: 'AhShuckie' },
  { id: 'b-poker', sprite: 'bld-poker', tx: 22, ty: 22, bw: 6, bh: 5, label: 'POKER ROOM', sublabel: 'PokerSolver', projectId: 'PokerSolver' },
  { id: 'b-contact', sprite: 'bld-contact', tx: 36, ty: 21, bw: 6, bh: 6, label: 'CONTACT TOWER', sublabel: "let's work", projectId: 'contact' },
  { id: 'b-archive', sprite: 'bld-archive', tx: 36, ty: 13, bw: 8, bh: 5, label: 'THE ARCHIVE', sublabel: 'all 26 repos', projectId: 'archive' },
];

/* approach paths to each building door */
(() => {
  for (const b of BUILDINGS) {
    const doorCx = b.tx + Math.floor(b.bw / 2);
    for (let dy = b.ty + b.bh; dy < b.ty + b.bh + 3; dy++) {
      if (dy >= WORLD_H - 1) break;
      for (const dx of [doorCx - 1, doorCx]) {
        const i = dy * WORLD_W + dx;
        TILEMAP.ground[i] = 'path';
        TILEMAP.solid[i] = false;
      }
    }
  }
})();

/* ============================================================ */
/* NPCs                                                         */
/* ============================================================ */

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
    tx: 26,
    ty: 19,
    label: 'GREETER',
    facing: 'down',
    lines: [
      "Welcome to Programming Town.",
      "WASD or arrow keys to walk. SPACE near a building or NPC to interact.",
      "TAB for the readable text-only view. M for menu. Backtick (~) for the dev console.",
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
      "The Overlay Arena up north runs the actual Gen 2 damage formula.",
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
    ty: 28,
    label: 'CASINO REGULAR',
    patrol: [
      { tx: 24, ty: 28 }, { tx: 27, ty: 28 },
    ],
    lines: [
      "PokerSolver runs Monte-Carlo equity in your browser tab.",
      "Step into the Poker Room. Deal two hands. Watch the curve converge.",
    ],
  },
  {
    id: 'npc-archivist',
    sprite: 'npc-ahshuckie',
    tx: 35,
    ty: 18,
    label: 'ARCHIVIST',
    facing: 'left',
    lines: [
      "All 26 shipped repos live in the Archive.",
      "It's the boring building. It's also the honest one.",
    ],
  },
];

/* ============================================================ */
/* World-space points of interest                               */
/* ============================================================ */

/** GameHook antenna tip — beacon emits a blinking red pulse here. */
export const GAMEHOOK_ANTENNA = {
  // building at tx=22 ty=5 (96..192 in px, top edge=80). antenna at right end (W-14)
  wx: (22 * 16) + (6 * 16 - 14),
  wy: 5 * 16,
};

/** Teo's house chimney — emits smoke. */
export const HOUSE_CHIMNEY = {
  wx: 9 * 16 + 12,
  wy: 12 * 16 + 2,
};
