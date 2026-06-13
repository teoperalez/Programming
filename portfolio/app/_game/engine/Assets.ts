/**
 * Procedural asset generator — production pass.
 *
 * Everything is painted at boot into offscreen canvases from authored
 * pixel grids (a tiny char→color DSL) plus parametric painters. No image
 * downloads. Animated tiles register multiple frames; tileSource(id, time)
 * resolves the current frame.
 */

export const TILE_SIZE = 16;

export const PAL = {
  void: '#07070b',
  ink: '#14131b',
  outline: '#1a1626',
  stone: '#2b2a36',
  fog: '#4e4a5c',
  paper: '#f4ecdc',
  paperDim: '#d8cfbe',
  paperMute: '#8a8377',
  fire: '#ff3c25',
  ember: '#b8270f',
  gold: '#ffb800',
  bronze: '#c08029',
  grass: '#5da838',
  grassLight: '#79c450',
  grassDim: '#3e7e1a',
  grassDark: '#2e6312',
  // low-contrast flecks for soft field texture
  grassFleck: '#54993170' as string,
  grassFleckHi: '#69b34060' as string,
  water: '#3f7fe8',
  waterLight: '#6aa6f5',
  waterDim: '#2255b8',
  plasma: '#6cf4d2',
  violet: '#a78bff',
  bone: '#efe3c2',
  path: '#c9a86a',
  pathLight: '#e0c389',
  pathDark: '#9d8050',
  brick: '#a8553a',
  brickDark: '#7c3a26',
  plaster: '#e8d9b8',
  plasterShade: '#cdbc97',
} as const;

const PLASTER_SHADE = PAL.plasterShade;

export type TileID =
  | 'grass' | 'grass-2' | 'grass-3' | 'grass-dark'
  | 'tallgrass' | 'flower'
  | 'path' | 'path-edge-n' | 'path-edge-s' | 'path-edge-e' | 'path-edge-w'
  | 'water' | 'water-edge-n' | 'water-edge-s' | 'water-edge-e' | 'water-edge-w'
  | 'sand' | 'rock' | 'fence-h' | 'fence-v' | 'sign' | 'cobble' | 'cobble-2';

let tileAtlas: HTMLCanvasElement | null = null;
/** id → { slots: atlas slot indices per frame, speed: secs per frame } */
const tileIndex = new Map<TileID, { slots: number[]; speed: number }>();
let nextSlot = 0;
const ATLAS_COLS = 8;

function slotPos(slot: number): { x: number; y: number } {
  return { x: (slot % ATLAS_COLS) * TILE_SIZE, y: Math.floor(slot / ATLAS_COLS) * TILE_SIZE };
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}
function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Paint a char-grid into ctx at (ox,oy). Unknown chars are skipped. */
function paintGrid(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  rows: string[],
  map: Record<string, string>,
): void {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const col = map[row[x]];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }
}

type Painter = (ctx: CanvasRenderingContext2D, ox: number, oy: number) => void;

function placeTile(id: TileID, painters: Painter[], speed = 0): void {
  if (!tileAtlas) throw new Error('tileAtlas not init');
  const ctx = tileAtlas.getContext('2d')!;
  const slots: number[] = [];
  for (const paint of painters) {
    const slot = nextSlot++;
    const { x, y } = slotPos(slot);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.clip();
    paint(ctx, x, y);
    ctx.restore();
    slots.push(slot);
  }
  tileIndex.set(id, { slots, speed });
}

/* deterministic mini-rng so tiles look hand-placed, not random per boot */
function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ============================================================ */
/* TILES                                                        */
/* ============================================================ */

function grassBase(seed: number): Painter {
  return (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    const r = rng(seed);
    // low-contrast mottling so large grass fields read as soft texture,
    // never as noise. Flecks stay close to the base hue.
    for (let i = 0; i < 7; i++) {
      const x = ox + Math.floor(r() * TILE_SIZE);
      const y = oy + Math.floor(r() * TILE_SIZE);
      px(ctx, x, y, r() > 0.5 ? PAL.grassFleck : PAL.grassFleckHi);
    }
    // a couple of faint blade marks
    if (r() > 0.4) {
      const x = ox + 3 + Math.floor(r() * 9);
      const y = oy + 4 + Math.floor(r() * 8);
      px(ctx, x, y, PAL.grassFleck);
      px(ctx, x, y + 1, PAL.grassFleck);
    }
  };
}

function buildTiles(): void {
  tileAtlas = document.createElement('canvas');
  tileAtlas.width = TILE_SIZE * ATLAS_COLS;
  tileAtlas.height = TILE_SIZE * 8; // 64 slots
  nextSlot = 0;

  placeTile('grass', [grassBase(11)]);
  placeTile('grass-2', [grassBase(73)]);
  placeTile('grass-3', [grassBase(149)]);

  // a gentle darker patch (mossy dip), only marginally darker than base
  placeTile('grass-dark', [(ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    const r = rng(31);
    // soft irregular darker blob in the centre
    ctx.fillStyle = '#4f9131';
    for (let i = 0; i < 22; i++) {
      const a = r() * Math.PI * 2;
      const rad = r() * 6;
      px(ctx, ox + 8 + Math.round(Math.cos(a) * rad), oy + 8 + Math.round(Math.sin(a) * rad), '#4f9131');
    }
    for (let i = 0; i < 4; i++) px(ctx, ox + 4 + Math.floor(r() * 8), oy + 4 + Math.floor(r() * 8), '#458029');
  }]);

  // tall grass — RBY signature: distinct chunky 3-tuft pattern,
  // two animation frames where tufts lean opposite directions.
  const tall = (lean: number): Painter => (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    // base grass mottling first
    const r = rng(91 + lean);
    for (let i = 0; i < 4; i++) px(ctx, ox + Math.floor(r() * 16), oy + Math.floor(r() * 16), PAL.grassFleck);
    // three distinct tufts: left, center, right
    const drawTuft = (lcx: number, lbY: number, leanDir: number) => {
      const cx = ox + lcx;
      const baseY = oy + lbY;
      // outline & body — base lump
      rect(ctx, cx - 1, baseY,     3, 1, PAL.outline);
      rect(ctx, cx - 2, baseY - 1, 5, 1, PAL.outline);
      rect(ctx, cx - 1, baseY - 1, 3, 1, '#2e6b14');
      // blades fanning up
      px(ctx, cx,              baseY - 2, PAL.outline);
      px(ctx, cx + leanDir,    baseY - 2, PAL.outline);
      px(ctx, cx - leanDir,    baseY - 2, PAL.outline);
      px(ctx, cx,              baseY - 3, '#3e7e1a');
      px(ctx, cx + leanDir,    baseY - 3, '#3e7e1a');
      px(ctx, cx - leanDir,    baseY - 3, '#3e7e1a');
      px(ctx, cx + leanDir * 2, baseY - 4, '#3e7e1a');
    };
    drawTuft(3, 13, lean);
    drawTuft(8, 14, -lean);
    drawTuft(13, 13, lean);
  };
  placeTile('tallgrass', [tall(0), tall(1)], 0.55);

  // flower — 2 frames (petals tilt)
  const flower = (sway: number): Painter => (ctx, ox, oy) => {
    grassBase(91)(ctx, ox, oy);
    const fx = ox + 7 + sway, fy = oy + 6;
    px(ctx, fx, fy - 1, PAL.gold);
    px(ctx, fx - 1, fy, PAL.fire);
    px(ctx, fx + 1, fy, PAL.fire);
    px(ctx, fx, fy, PAL.gold);
    px(ctx, fx, fy + 1, PAL.fire);
    rect(ctx, ox + 7, fy + 2, 1, 4, PAL.grassDark);
    px(ctx, ox + 3, oy + 11, PAL.gold);
    px(ctx, ox + 12, oy + 4, PAL.bone);
  };
  placeTile('flower', [flower(0), flower(1)], 0.85);

  // path — soft dirt with worn texture + grass-blended edges
  const pathBase: Painter = (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.path);
    const r = rng(7);
    for (let i = 0; i < 9; i++) {
      px(ctx, ox + Math.floor(r() * 16), oy + Math.floor(r() * 16), r() > 0.5 ? PAL.pathDark : PAL.pathLight);
    }
    // pebbles
    px(ctx, ox + 4, oy + 11, PAL.pathDark);
    px(ctx, ox + 5, oy + 11, PAL.pathDark);
    px(ctx, ox + 11, oy + 5, PAL.pathDark);
  };
  placeTile('path', [pathBase]);
  const edge = (side: 'n' | 's' | 'e' | 'w'): Painter => (ctx, ox, oy) => {
    pathBase(ctx, ox, oy);
    // grass nibbling into the path edge — organic transition
    const r = rng(side.charCodeAt(0));
    for (let i = 0; i < 16; i++) {
      const t = Math.floor(r() * 16);
      const d = Math.floor(r() * 3); // 0..2 deep
      const c = r() > 0.5 ? PAL.grass : PAL.grassDim;
      if (side === 'n') { px(ctx, ox + t, oy + 0, c); if (d > 1) px(ctx, ox + t, oy + 1, PAL.grass); }
      if (side === 's') { px(ctx, ox + t, oy + 15, c); if (d > 1) px(ctx, ox + t, oy + 14, PAL.grass); }
      if (side === 'e') { px(ctx, ox + 15, oy + t, c); if (d > 1) px(ctx, ox + 14, oy + t, PAL.grass); }
      if (side === 'w') { px(ctx, ox + 0, oy + t, c); if (d > 1) px(ctx, ox + 1, oy + t, PAL.grass); }
    }
  };
  placeTile('path-edge-n', [edge('n')]);
  placeTile('path-edge-s', [edge('s')]);
  placeTile('path-edge-e', [edge('e')]);
  placeTile('path-edge-w', [edge('w')]);

  // water — 4 animated frames with traveling highlights
  const water = (phase: number): Painter => (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.water);
    // depth shadow at bottom
    rect(ctx, ox, oy + 13, TILE_SIZE, 3, PAL.waterDim);
    // moving sparkle rows
    for (let rIdx = 0; rIdx < 3; rIdx++) {
      const y = oy + 2 + rIdx * 4;
      const off = (phase * 2 + rIdx * 5) % 16;
      rect(ctx, ox + off, y, 3, 1, PAL.waterLight);
      rect(ctx, ox + ((off + 9) % 16), y + 2, 2, 1, PAL.waterDim);
    }
    if (phase % 2 === 0) px(ctx, ox + ((phase * 3) % 14) + 1, oy + 7, '#ffffff');
  };
  placeTile('water', [water(0), water(1), water(2), water(3)], 0.45);
  const wedge = (side: 'n' | 's' | 'e' | 'w'): Painter => (ctx, ox, oy) => {
    water(0)(ctx, ox, oy);
    const lip = PAL.bone;
    if (side === 'n') { rect(ctx, ox, oy, TILE_SIZE, 2, lip); rect(ctx, ox, oy + 2, TILE_SIZE, 1, PAL.waterLight); }
    if (side === 's') { rect(ctx, ox, oy + 14, TILE_SIZE, 2, lip); }
    if (side === 'e') { rect(ctx, ox + 14, oy, 2, TILE_SIZE, lip); }
    if (side === 'w') { rect(ctx, ox, oy, 2, TILE_SIZE, lip); rect(ctx, ox + 2, oy, 1, TILE_SIZE, PAL.waterLight); }
  };
  placeTile('water-edge-n', [wedge('n')]);
  placeTile('water-edge-s', [wedge('s')]);
  placeTile('water-edge-e', [wedge('e')]);
  placeTile('water-edge-w', [wedge('w')]);

  placeTile('sand', [(ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.bone);
    const r = rng(19);
    for (let i = 0; i < 8; i++) px(ctx, ox + Math.floor(r() * 16), oy + Math.floor(r() * 16), PAL.bronze);
  }]);

  placeTile('rock', [(ctx, ox, oy) => {
    grassBase(67)(ctx, ox, oy);
    // boulder with outline + highlight
    rect(ctx, ox + 3, oy + 6, 10, 7, PAL.outline);
    rect(ctx, ox + 4, oy + 5, 8, 8, PAL.outline);
    rect(ctx, ox + 4, oy + 6, 8, 6, PAL.fog);
    rect(ctx, ox + 5, oy + 6, 4, 2, PAL.paperMute);
    rect(ctx, ox + 5, oy + 11, 6, 1, PAL.stone);
    rect(ctx, ox + 4, oy + 13, 9, 1, 'rgba(0,0,0,0.25)');
  }]);

  const fenceH: Painter = (ctx, ox, oy) => {
    grassBase(23)(ctx, ox, oy);
    rect(ctx, ox, oy + 6, TILE_SIZE, 1, PAL.outline);
    rect(ctx, ox, oy + 7, TILE_SIZE, 2, PAL.bone);
    rect(ctx, ox, oy + 9, TILE_SIZE, 1, PAL.bronze);
    for (const fx of [2, 11]) {
      rect(ctx, ox + fx, oy + 3, 1, 10, PAL.outline);
      rect(ctx, ox + fx + 1, oy + 3, 2, 10, PAL.bone);
      rect(ctx, ox + fx + 1, oy + 12, 2, 1, PAL.bronze);
      px(ctx, ox + fx + 1, oy + 3, PAL.paper);
    }
  };
  placeTile('fence-h', [fenceH]);
  placeTile('fence-v', [(ctx, ox, oy) => {
    grassBase(29)(ctx, ox, oy);
    rect(ctx, ox + 6, oy, 1, TILE_SIZE, PAL.outline);
    rect(ctx, ox + 7, oy, 2, TILE_SIZE, PAL.bone);
    rect(ctx, ox + 9, oy, 1, TILE_SIZE, PAL.bronze);
    rect(ctx, ox + 4, oy + 3, 8, 2, PAL.bone);
    rect(ctx, ox + 4, oy + 11, 8, 2, PAL.bone);
  }]);

  placeTile('sign', [(ctx, ox, oy) => {
    grassBase(41)(ctx, ox, oy);
    rect(ctx, ox + 7, oy + 9, 2, 6, PAL.brickDark);
    rect(ctx, ox + 2, oy + 2, 12, 8, PAL.outline);
    rect(ctx, ox + 3, oy + 3, 10, 6, PAL.bronze);
    rect(ctx, ox + 3, oy + 3, 10, 1, PAL.gold);
    rect(ctx, ox + 4, oy + 5, 8, 1, PAL.ink);
    rect(ctx, ox + 4, oy + 7, 5, 1, PAL.ink);
  }]);

  // warm sandstone plaza paving — reads as a town square, not a pit
  const cobble = (seed: number): Painter => (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, '#b8a37a'); // mortar
    const r = rng(seed);
    const stones = ['#cdb78c', '#c4ad82', '#d4be94', '#bda478'];
    for (let yy = 0; yy < 16; yy += 4) {
      for (let xx = 0; xx < 16; xx += 4) {
        const jx = ox + xx + ((yy / 4) % 2 ? 2 : 0);
        if (jx + 3 <= ox + 16) {
          const c = stones[Math.floor(r() * stones.length)];
          rect(ctx, jx, oy + yy, 3, 3, c);
          // top-left highlight, bottom-right shade for a bevel
          px(ctx, jx, oy + yy, '#e0cda2');
          px(ctx, jx + 2, oy + yy + 2, '#9d8a64');
        }
      }
    }
  };
  placeTile('cobble', [cobble(3)]);
  placeTile('cobble-2', [cobble(77)]);
}

export function tileSource(id: TileID, time = 0): { atlas: HTMLCanvasElement; sx: number; sy: number; sw: number; sh: number } {
  if (!tileAtlas) throw new Error('Assets not booted');
  const entry = tileIndex.get(id);
  if (!entry) throw new Error('unknown tile ' + id);
  const frame = entry.speed > 0 ? Math.floor(time / entry.speed) % entry.slots.length : 0;
  const { x, y } = slotPos(entry.slots[frame]);
  return { atlas: tileAtlas, sx: x, sy: y, sw: TILE_SIZE, sh: TILE_SIZE };
}

/* ============================================================ */
/* SPRITES                                                      */
/* ============================================================ */

export interface SpriteSheet {
  canvas: HTMLCanvasElement;
  frame: { w: number; h: number };
  cols: number;
  rows: number;
}

const sprites = new Map<string, SpriteSheet>();
export function getSprite(id: string): SpriteSheet {
  const s = sprites.get(id);
  if (!s) throw new Error('unknown sprite ' + id);
  return s;
}

/* ---- characters (16×24, 4 facings × 3 frames) ---- */
/* RBY-influenced trainer: chunky cap with brim, light jacket trim, plain
 * dark pants. Designed at 16×24 (head 6, torso 9, legs 9) with hard
 * 1px outlines and 4-color silhouettes per layer. */

interface CharColors {
  /** cap crown */
  cap: string;
  /** cap brim + dark accents */
  capDark: string;
  hair: string;
  skin: string;
  skinDark: string;
  /** jacket main */
  jacket: string;
  /** jacket trim (collar, cuffs, zipper) */
  jacketTrim: string;
  jacketDark: string;
  pants: string;
  boots: string;
}

const mirror = (rows: string[]): string[] => rows.map((r) => r.split('').reverse().join(''));

/** Head + cap rows (8 rows) per facing. Exactly 16 chars wide.
 * Legend: o=outline, c=cap, C=cap-light, b=brim-dark, h=hair, s=skin,
 * S=skin-shade, e=eye(outline), p=pupil(outline). */
function headRows(face: 'down' | 'up' | 'side'): string[] {
  if (face === 'down') {
    // peaked cap pointing forward, brim above the eyes
    return [
      '.....oCCCCo.....',
      '....occCCcco....',
      '...oCCCCCcCco...',
      '...obbbbbbbbo...',
      '...ohshhhhhsho..',
      '...oshseеsshso..'.replace(/е/g, 'e'),
      '....osssssso....',
      '.....oSSSSo.....',
    ];
  }
  if (face === 'up') {
    // back of head, cap dominates
    return [
      '.....oCCCCo.....',
      '....occCCcco....',
      '...oCccCCCCco...',
      '...occcCCccco...',
      '...ohhhhhhhho...',
      '....ohhhhhho....',
      '.....ohhhho.....',
      '......oooo......',
    ];
  }
  // side — right-facing (brim sticks out forward at +x)
  return [
    '.....oCCCCob....',
    '....occCCcbbo...',
    '...oCccCCcobo...',
    '...obbbbbbbo....',
    '...ohshhhso.....',
    '...oshseso......',
    '....ossso.......',
    '.....oSSo.......',
  ];
}

/** Torso rows (9 rows) per facing. j=jacket, J=jacket-light(trim),
 *  d=jacket-dark, B=backpack-strap (visible in side/back), s=skin. */
function torsoRows(face: 'down' | 'up' | 'side'): string[] {
  if (face === 'down') {
    return [
      '....ojJJJJJjo...',
      '...ojjjJJjjjjo..',
      '..ojjjjJJjjjjjo.',
      '..ojjjjJJjjjjjo.',
      '..osjjjJJjjjjso.',
      '..osjjjJJjjjjso.',
      '..osjjjJJjjjjso.',
      '...ojjjjjjjjjo..',
      '...oddddddddoo..',
    ];
  }
  if (face === 'up') {
    // back: visible backpack strap silhouette
    return [
      '....odddddddo...',
      '...odBBBBBBBdo..',
      '..odBjjjjjjBdo..',
      '..odBjjjjjjBdo..',
      '..odBjjjjjjBdo..',
      '..odBjjjjjjBdo..',
      '..odBjjjjjjBdo..',
      '...ojjjjjjjjo...',
      '...oddddddddo...',
    ];
  }
  // side facing right
  return [
    '....ojJJJJjo....',
    '...ojJjJJjjjo...',
    '...ojjjJJjjBo...',
    '...ojjjJJjjBo...',
    '...osjjJJjjBo...',
    '...osjjJjjjBo...',
    '...osjjjjjjBo...',
    '....ojjjjjjo....',
    '....odddddoo....',
  ];
}

/** Leg rows (7 rows): stand / stepA / stepB. p=pants, k=pants-dark,
 *  z=boots, exactly 16 chars wide. */
function legRows(variant: 'stand' | 'a' | 'b', face: 'down' | 'up' | 'side'): string[] {
  if (face === 'side') {
    if (variant === 'stand') {
      return [
        '....opppppppo...',
        '....opkppkppo...',
        '....opppppppo...',
        '.....oppppo.....',
        '.....ozzzzo.....',
        '.....oozzoo.....',
        '......oooo......',
      ];
    }
    if (variant === 'a') {
      return [
        '....opppppppo...',
        '....opkppkppo...',
        '...oppooppppo...',
        '..oppoo.ozppo...',
        '..ozzo..ozzo....',
        '..oooo..oooo....',
        '................',
      ];
    }
    return [
      '....opppppppo...',
      '....opkppkppo...',
      '...opppooppo....',
      '...opzo.oppoo...',
      '...ozzo..ozzo...',
      '...oooo..oooo...',
      '................',
    ];
  }
  // down / up share leg silhouettes
  if (variant === 'stand') {
    return [
      '....opppppppo...',
      '....opkppkppo...',
      '....opp..ppo....',
      '....opp..ppo....',
      '....ozz..zzo....',
      '....ozz..zzo....',
      '.....oo..oo.....',
    ];
  }
  if (variant === 'a') {
    return [
      '....opppppppo...',
      '....opkppkppo...',
      '...oppo..ppo....',
      '..oppo..oppo....',
      '..ozzo..ozzo....',
      '..oooo..oooo....',
      '................',
    ];
  }
  return [
    '....opppppppo...',
    '....opkppkppo...',
    '....oppoopppo...',
    '....oppo.oppo...',
    '....ozzo.ozzo...',
    '....oooo.oooo...',
    '................',
  ];
}

function charMap(c: CharColors): Record<string, string> {
  return {
    o: PAL.outline,
    c: c.cap,
    C: c.cap, // (kept for compatibility — same as c)
    b: c.capDark, // brim (when in head row context)
    h: c.hair,
    s: c.skin,
    S: c.skinDark,
    e: PAL.outline,
    j: c.jacket,
    J: c.jacketTrim,
    d: c.jacketDark,
    B: c.jacketDark, // backpack strap
    p: c.pants,
    k: PAL.outline, // pants seam / dark stripe
    z: c.boots,
  };
}

function buildCharacter(id: string, colors: CharColors): void {
  const FW = 16, FH = 24;
  const cv = document.createElement('canvas');
  cv.width = FW * 4; // facings: down, up, right, left
  cv.height = FH * 3; // frames: idle, stepA, stepB
  const ctx = cv.getContext('2d')!;
  const map = charMap(colors);

  const facings: Array<{ face: 'down' | 'up' | 'side'; flip: boolean }> = [
    { face: 'down', flip: false },
    { face: 'up', flip: false },
    { face: 'side', flip: false },
    { face: 'side', flip: true },
  ];
  const variants: Array<'stand' | 'a' | 'b'> = ['stand', 'a', 'b'];

  facings.forEach(({ face, flip }, col) => {
    variants.forEach((variant, row) => {
      // head 8 + torso 9 + legs 7 = 24 rows total
      let rows = [...headRows(face), ...torsoRows(face), ...legRows(variant, face)];
      if (flip) rows = mirror(rows);
      paintGrid(ctx, col * FW, row * FH, rows, map);
    });
  });

  sprites.set(id, { canvas: cv, frame: { w: FW, h: FH }, cols: 4, rows: 3 });
}

/* ---- trees (RBY-style 16×16 squat single-tile, plus a 16×32 tall
 * variant for the world borders) ---- */

function buildTree(id: string, kind: 'round' | 'pine' | 'rby-squat'): void {
  if (kind === 'rby-squat') {
    // Iconic Pallet/Viridian-style tree: single 16×16 tile, plump round
    // canopy with horizontal striping, tiny trunk peek at the bottom.
    const cv = document.createElement('canvas');
    cv.width = 16;
    cv.height = 16;
    const ctx = cv.getContext('2d')!;
    paintGrid(ctx, 0, 0, [
      '....ooooooo.....',
      '..ooGGGGGGGoo...',
      '.oGGggGGGGGGGo..',
      'oGGgggdgggGGGo..',
      'oGggggggggggGGo.',
      'oggdgggggggggGo.',
      'oggggggggdgggGo.',
      'ogggdgggggggggo.',
      'odggggggdggggdo.',
      'oddgggggggggddo.',
      '.oddggdgggdddo..',
      '..oddddddddoo...',
      '...oooooooo.....',
      '.....obtbo......',
      '.....obtbo......',
      '......oo........',
    ], {
      o: PAL.outline,
      G: '#7fcc4a',   // light leaf
      g: '#4a9a28',   // mid leaf (canopy base)
      d: '#2e6b14',   // shadow stripe
      b: '#6b4226',
      t: '#4e2f1a',
    });
    // small drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(7.5, 14.5, 4.5, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    sprites.set(id, { canvas: cv, frame: { w: 16, h: 16 }, cols: 1, rows: 1 });
    return;
  }
  // 16×32 tall trees (round & pine) for the dense wood-frame at world edges.
  const cv = document.createElement('canvas');
  cv.width = 16;
  cv.height = 32;
  const ctx = cv.getContext('2d')!;
  if (kind === 'round') {
    paintGrid(ctx, 0, 0, [
      '....oooooo......',
      '..oogGGGGgoo....',
      '.oGGGGGGGGGGo...',
      '.oGGgggdgGGGo...',
      'oGGggggggggGGo..',
      'oGgggggggggggGo.',
      'oggggdgggggggGo.',
      'ogggdggggdgggGo.',
      'oggggggdggggggo.',
      'odgggggggggggdo.',
      '.odgggdgggdgdo..',
      '..oddddddddoo...',
      '...oooooooo.....',
      '.....obbbo......',
      '.....obtbo......',
      '.....obtbo......',
    ], { o: PAL.outline, G: '#7fcc4a', g: '#4a9a28', d: '#2e6b14', b: '#6b4226', t: '#4e2f1a' });
    paintGrid(ctx, 0, 16, [
      '.....obtbo......',
      '....obbtbbo.....',
      '....obtttbo.....',
      '....obbtbbo.....',
      '....obttttbo....',
      '...oobbbbboo....',
      '..o.oooooo.o....',
      '................',
    ], { o: PAL.outline, b: '#6b4226', t: '#4e2f1a' });
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(7.5, 23, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // pine — tall conifer
    paintGrid(ctx, 0, 0, [
      '.......oo.......',
      '......oGGo......',
      '.....oGGggo.....',
      '....oGGggggo....',
      '...oGGggggggo...',
      '....ogggggdo....',
      '...oGgggggggo...',
      '..oGGggggggggo..',
      '.ogggggggggdggo.',
      '....oggggddo....',
      '...ogggggggdo...',
      '..oggggggggggo..',
      '.ogggdgggggddgo.',
      'ogggggggdgggggdo',
      '.oooooobbooooo..',
      '......obtbo.....',
    ], { o: PAL.outline, G: '#7fcc4a', g: '#4a9a28', d: '#2e6b14', b: '#6b4226', t: '#4e2f1a' });
    paintGrid(ctx, 0, 16, [
      '......obtbo.....',
      '.....obtttbo....',
      '.....obtbtbo....',
      '.....obtttbo....',
      '....ooooooooo...',
      '................',
      '................',
      '................',
    ], { o: PAL.outline, b: '#6b4226', t: '#4e2f1a' });
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(7.5, 21, 5.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  sprites.set(id, { canvas: cv, frame: { w: 16, h: 32 }, cols: 1, rows: 1 });
}

/* ---- lamp post (10×28) ---- */

function buildLamp(): void {
  const cv = document.createElement('canvas');
  cv.width = 10;
  cv.height = 28;
  const ctx = cv.getContext('2d')!;
  // base
  rect(ctx, 3, 25, 4, 3, PAL.outline);
  rect(ctx, 2, 27, 6, 1, PAL.outline);
  rect(ctx, 3, 25, 4, 1, '#3a3947');
  // post
  rect(ctx, 4, 8, 2, 18, PAL.stone);
  rect(ctx, 4, 8, 1, 18, '#3a3947');
  // cross arm hint
  rect(ctx, 3, 9, 4, 1, PAL.stone);
  // lantern housing
  rect(ctx, 2, 2, 6, 7, PAL.outline);
  rect(ctx, 3, 3, 4, 5, '#ffd27a');
  rect(ctx, 3, 3, 4, 2, '#fff0c0');
  // glass mullion
  px(ctx, 4, 3, PAL.bronze);
  px(ctx, 5, 6, PAL.bronze);
  // cap
  rect(ctx, 2, 1, 6, 1, PAL.outline);
  rect(ctx, 4, 0, 2, 1, PAL.outline);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(5, 27, 4, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  sprites.set('lamp', { canvas: cv, frame: { w: 10, h: 28 }, cols: 1, rows: 1 });
}

/* ---- bush (16×14) ---- */

function buildBush(berries: boolean): void {
  const cv = document.createElement('canvas');
  cv.width = 16;
  cv.height = 14;
  const ctx = cv.getContext('2d')!;
  paintGrid(ctx, 0, 0, [
    '...oooooooo.....',
    '..oGGgggggGo....',
    '.oGggggdgggGo...',
    'oGgggggggggdGo..',
    'oggdgggggggggo..',
    'oggggggdggggdo..',
    '.oggdggggggggo..',
    '.odgggggdgggdo..',
    '..oddgggggddo...',
    '...ooooooooo....',
    '................',
    '................',
    '................',
    '................',
  ], { o: PAL.outline, G: '#79c450', g: '#4f9a2f', d: '#367018' });
  if (berries) {
    px(ctx, 5, 4, PAL.fire); px(ctx, 9, 6, PAL.fire); px(ctx, 11, 3, PAL.gold); px(ctx, 7, 7, PAL.fire);
  }
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(8, 11, 6, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  sprites.set(berries ? 'bush-berry' : 'bush', { canvas: cv, frame: { w: 16, h: 14 }, cols: 1, rows: 1 });
}

/* ---- flower bed (16×16 tile-like sprite) ---- */

function buildFlowerbed(): void {
  const cv = document.createElement('canvas');
  cv.width = 16;
  cv.height = 16;
  const ctx = cv.getContext('2d')!;
  // soil border
  rect(ctx, 1, 1, 14, 14, PAL.brickDark);
  rect(ctx, 2, 2, 12, 12, '#6b4a2a');
  // flowers
  const r = rng(5);
  const cols = [PAL.fire, PAL.gold, PAL.violet, '#ff7ab0'];
  for (let i = 0; i < 7; i++) {
    const x = 3 + Math.floor(r() * 10);
    const y = 3 + Math.floor(r() * 10);
    const c = cols[Math.floor(r() * cols.length)];
    px(ctx, x, y - 1, c); px(ctx, x - 1, y, c); px(ctx, x + 1, y, c); px(ctx, x, y, '#ffe9b8'); px(ctx, x, y + 1, c);
    px(ctx, x, y + 2, PAL.grassDark);
  }
  sprites.set('flowerbed', { canvas: cv, frame: { w: 16, h: 16 }, cols: 1, rows: 1 });
}

/* ---- fountain (32×32, 3 frames) ---- */

function buildFountain(): void {
  const F = 32;
  const cv = document.createElement('canvas');
  cv.width = F * 3;
  cv.height = F;
  const ctx = cv.getContext('2d')!;
  for (let f = 0; f < 3; f++) {
    const ox = f * F;
    // basin
    rect(ctx, ox + 2, 14, 28, 14, PAL.outline);
    rect(ctx, ox + 3, 15, 26, 12, PAL.fog);
    rect(ctx, ox + 4, 16, 24, 9, PAL.stone);
    rect(ctx, ox + 5, 17, 22, 7, PAL.waterDim);
    // animated water surface
    for (let i = 0; i < 5; i++) {
      const wx = ox + 6 + ((i * 5 + f * 2) % 20);
      rect(ctx, wx, 18 + (i % 3) * 2, 3, 1, PAL.waterLight);
    }
    // pedestal + spout
    rect(ctx, ox + 13, 6, 6, 12, PAL.outline);
    rect(ctx, ox + 14, 7, 4, 10, PAL.fog);
    rect(ctx, ox + 14, 7, 4, 2, PAL.paperMute);
    // jet (3 frames of spray)
    const jetH = [5, 7, 6][f];
    rect(ctx, ox + 15, 7 - jetH, 2, jetH, PAL.waterLight);
    px(ctx, ox + 14, 8 - jetH, '#ffffff');
    px(ctx, ox + 17, 9 - jetH, '#ffffff');
    // droplets
    px(ctx, ox + 11 + f, 12, PAL.waterLight);
    px(ctx, ox + 20 - f, 13, PAL.waterLight);
    px(ctx, ox + 9 + f * 2, 16, '#ffffff');
    // rim highlight
    rect(ctx, ox + 3, 15, 26, 1, PAL.paperMute);
    // base shadow
    rect(ctx, ox + 4, 27, 24, 2, 'rgba(0,0,0,0.25)');
  }
  sprites.set('fountain', { canvas: cv, frame: { w: F, h: F }, cols: 3, rows: 1 });
}

/* ---- buildings ---- */

interface BuildingStyle {
  wTiles: number;
  hTiles: number;
  roof: string;
  roofDark: string;
  accent: string;
  prop: 'antenna' | 'neon' | 'reel' | 'flags' | 'chimney' | 'columns' | 'orb' | 'none';
}

function buildBuilding(id: string, st: BuildingStyle): void {
  const W = st.wTiles * TILE_SIZE;
  const H = st.hTiles * TILE_SIZE;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;

  // ---- RBY-style peaked roof: triangular silhouette with shingle rows ----
  // The roof occupies the top ~38% of the building; sides taper inward.
  const roofH = Math.floor(H * 0.38);
  const roofPad = 2; // how far the roof base overhangs the wall
  // First fill the wall area (will be drawn over).
  rect(ctx, 0, roofH, W, H - roofH, '#f4ecdc');                // white walls (RBY look)
  rect(ctx, 0, roofH, W, 3, 'rgba(0,0,0,0.32)');               // deep eave shadow
  rect(ctx, 0, H - 5, W, 5, '#c0b291');                        // foundation strip
  rect(ctx, 0, H - 2, W, 2, PAL.outline);

  // Roof — peaked: rows narrow toward the top
  const peakInset = (y: number) => {
    // 0 at the base of the roof, max inset at the peak
    const t = 1 - y / roofH;
    return Math.floor(t * (W / 2 - 4));
  };
  for (let y = 0; y < roofH; y++) {
    const inset = peakInset(y);
    // outline
    px(ctx, inset, y, PAL.outline);
    px(ctx, W - 1 - inset, y, PAL.outline);
    // shingle rows: alternate darker stripes every 3 px
    const baseColor = y % 6 < 3 ? st.roof : st.roofDark;
    for (let x = inset + 1; x < W - 1 - inset; x++) {
      px(ctx, x, y, baseColor);
    }
    // shingle row separators
    if (y % 3 === 2) {
      for (let x = inset + 1; x < W - 1 - inset; x++) {
        px(ctx, x, y, st.roofDark);
      }
    }
    // staggered nail dots every other row
    if (y % 3 === 1) {
      const off = (y / 3 | 0) % 2 ? 2 : 4;
      for (let x = inset + 1 + off; x < W - 1 - inset; x += 6) {
        px(ctx, x, y, st.roofDark);
      }
    }
  }
  // bright ridge highlight at the peak
  for (let x = Math.floor(W / 2) - 4; x <= Math.floor(W / 2) + 4; x++) {
    px(ctx, x, 1, 'rgba(255,255,255,0.45)');
  }
  // eaves: thick dark strip at the very bottom of the roof
  rect(ctx, -roofPad, roofH - 3, W + roofPad * 2, 3, st.roofDark);
  rect(ctx, -roofPad, roofH - 1, W + roofPad * 2, 1, PAL.outline);
  rect(ctx, -roofPad, roofH, W + roofPad * 2, 1, 'rgba(0,0,0,0.35)');

  // ---- wall texture: subtle plaster grain ----
  const rgr = rng(id.length * 31 + 7);
  for (let i = 0; i < W / 3; i++) {
    px(ctx, Math.floor(rgr() * W), roofH + 4 + Math.floor(rgr() * (H - roofH - 10)), 'rgba(0,0,0,0.04)');
  }

  // ---- windows: classic 4-pane RBY style ----
  const winY = roofH + 9;
  const winW = 10, winH = 12;
  const drawWindow = (wx: number) => {
    // dark frame
    rect(ctx, wx - 1, winY - 1, winW + 2, winH + 2, PAL.outline);
    rect(ctx, wx, winY, winW, winH, '#1a2855'); // dark teal pane
    // lit highlight in upper-left two quadrants
    rect(ctx, wx + 1, winY + 1, winW / 2 - 1, winH / 2 - 1, '#7dc4ff');
    rect(ctx, wx + 1, winY + 1, winW / 2 - 1, 2, '#bce4ff');
    // mullions (window crossbars)
    rect(ctx, wx + winW / 2 - 1, winY, 2, winH, PAL.outline);
    rect(ctx, wx, winY + winH / 2 - 1, winW, 2, PAL.outline);
    // sill
    rect(ctx, wx - 2, winY + winH + 1, winW + 4, 2, '#a39378');
    px(ctx, wx - 2, winY + winH + 1, PAL.outline);
    px(ctx, wx + winW + 1, winY + winH + 1, PAL.outline);
  };
  // Two windows for typical building, three for the wide Archive
  if (W >= 110) {
    drawWindow(8);
    drawWindow((W - winW) / 2);
    drawWindow(W - 8 - winW);
  } else {
    drawWindow(6);
    drawWindow(W - 6 - winW);
  }

  // ---- double-door: RBY-mart-style sliding doors with frame ----
  const dx = Math.floor(W / 2) - 8;
  const doorW = 16, doorH = 22;
  const dy = H - doorH - 4;
  // archway outline
  rect(ctx, dx - 2, dy - 2, doorW + 4, 2, PAL.outline);          // door header
  rect(ctx, dx - 2, dy - 2, 2, doorH + 2, PAL.outline);          // left frame
  rect(ctx, dx + doorW, dy - 2, 2, doorH + 2, PAL.outline);      // right frame
  rect(ctx, dx, dy, doorW, doorH, '#384a7a');                    // dark glass tint
  // split into two sliding panels
  rect(ctx, dx + doorW / 2 - 1, dy, 2, doorH, PAL.outline);
  // lit highlight on glass
  rect(ctx, dx + 2, dy + 2, doorW / 2 - 3, 6, '#7dc4ff');
  rect(ctx, dx + 2, dy + 2, doorW / 2 - 3, 2, '#bce4ff');
  rect(ctx, dx + doorW / 2 + 1, dy + 2, doorW / 2 - 3, 6, '#7dc4ff');
  rect(ctx, dx + doorW / 2 + 1, dy + 2, doorW / 2 - 3, 2, '#bce4ff');
  // door handles
  px(ctx, dx + doorW / 2 - 3, dy + doorH / 2 + 1, PAL.gold);
  px(ctx, dx + doorW / 2 + 2, dy + doorH / 2 + 1, PAL.gold);
  // warm glow spill onto the foundation strip
  rect(ctx, dx, H - 4, doorW, 2, 'rgba(255,184,60,0.45)');
  // stoop
  rect(ctx, dx - 3, H - 2, doorW + 6, 2, '#a39378');
  px(ctx, dx - 3, H - 2, PAL.outline);
  px(ctx, dx + doorW + 2, H - 2, PAL.outline);

  // ---- sign band on the wall (above the door) ----
  const signW = Math.min(W - 12, 80);
  const sx = Math.floor(W / 2 - signW / 2);
  const sy = roofH + 2;
  rect(ctx, sx - 1, sy - 1, signW + 2, 12, PAL.outline);
  rect(ctx, sx, sy, signW, 10, st.accent);
  rect(ctx, sx, sy, signW, 2, 'rgba(255,255,255,0.5)');
  rect(ctx, sx, sy + 8, signW, 2, 'rgba(0,0,0,0.32)');

  // ---- per-building props (preserved from previous pass) ----
  switch (st.prop) {
    case 'antenna': {
      const ax = W - 14;
      rect(ctx, ax, 0, 1, 14, PAL.outline);
      rect(ctx, ax - 3, 3, 7, 1, PAL.outline);
      rect(ctx, ax - 2, 6, 5, 1, PAL.outline);
      px(ctx, ax, 0, PAL.fire);
      break;
    }
    case 'neon': {
      // RBY-Game Corner inspired neon trim around the sign
      for (let i = 0; i < signW + 2; i += 2) {
        px(ctx, sx - 1 + i, sy - 2, i % 4 === 0 ? PAL.fire : PAL.gold);
        px(ctx, sx - 1 + i, sy + 11, i % 4 === 0 ? PAL.gold : PAL.fire);
      }
      px(ctx, 5, roofH + 26, PAL.fire);
      px(ctx, W - 6, roofH + 26, PAL.ink);
      break;
    }
    case 'reel': {
      const cx = sx - 7, cy = sy + 5;
      ctx.fillStyle = PAL.outline;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7dc4ff';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      for (const [hx, hy] of [[-2, 0], [2, 0], [0, -2], [0, 2]] as const) {
        px(ctx, cx + hx, cy + hy, PAL.ink);
      }
      break;
    }
    case 'flags': {
      for (const fx of [4, W - 5]) {
        rect(ctx, fx, 0, 1, 8, PAL.outline);
        px(ctx, fx + 1, 0, PAL.fire); px(ctx, fx + 2, 0, PAL.fire); px(ctx, fx + 3, 0, PAL.fire);
        px(ctx, fx + 1, 1, PAL.fire); px(ctx, fx + 2, 1, PAL.fire);
        px(ctx, fx + 1, 2, PAL.fire);
      }
      break;
    }
    case 'chimney': {
      // RBY-style chimney rising off the roof slope (offset to one side)
      const cwid = 6;
      const cx = Math.floor(W / 4);
      rect(ctx, cx, 0, cwid, roofH - 4, PAL.outline);
      rect(ctx, cx + 1, 1, cwid - 2, roofH - 6, '#a8553a');
      rect(ctx, cx + 1, 1, cwid - 2, 2, '#7c3a26');
      rect(ctx, cx, 0, cwid, 1, '#3a3947');
      break;
    }
    case 'columns': {
      for (const cx of [dx - 9, dx + doorW + 5]) {
        rect(ctx, cx, roofH + 4, 5, H - roofH - 6, PAL.bone);
        rect(ctx, cx, roofH + 4, 1, H - roofH - 6, '#fff');
        rect(ctx, cx + 4, roofH + 4, 1, H - roofH - 6, '#a39378');
        rect(ctx, cx - 1, roofH + 3, 7, 3, PAL.bone);
        rect(ctx, cx - 1, H - 6, 7, 3, PAL.bone);
        rect(ctx, cx - 1, roofH + 3, 7, 1, PAL.outline);
        rect(ctx, cx - 1, H - 6, 7, 1, PAL.outline);
      }
      break;
    }
    case 'orb': {
      const ox2 = Math.floor(W / 2);
      rect(ctx, ox2 - 2, 0, 4, 4, PAL.outline);
      rect(ctx, ox2 - 1, 0, 2, 3, PAL.gold);
      break;
    }
  }

  // foundation cap shadow
  rect(ctx, 0, H - 6, W, 1, 'rgba(0,0,0,0.18)');

  sprites.set(id, { canvas: cv, frame: { w: W, h: H }, cols: 1, rows: 1 });
}

/* ============================================================ */
/* bitmap font (unchanged API)                                  */
/* ============================================================ */

const FONT_DATA: Record<string, string[]> = {
  'A': [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  'B': ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### '],
  'C': [' ####', '#    ', '#    ', '#    ', '#    ', '#    ', ' ####'],
  'D': ['#### ', '#   #', '#   #', '#   #', '#   #', '#   #', '#### '],
  'E': ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'],
  'F': ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#    '],
  'G': [' ####', '#    ', '#    ', '#  ##', '#   #', '#   #', ' ### '],
  'H': ['#   #', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  'I': ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '#####'],
  'J': ['#####', '   # ', '   # ', '   # ', '   # ', '#  # ', ' ##  '],
  'K': ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'],
  'L': ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
  'M': ['#   #', '## ##', '# # #', '#   #', '#   #', '#   #', '#   #'],
  'N': ['#   #', '##  #', '# # #', '#  ##', '#   #', '#   #', '#   #'],
  'O': [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  'P': ['#### ', '#   #', '#   #', '#### ', '#    ', '#    ', '#    '],
  'Q': [' ### ', '#   #', '#   #', '#   #', '# # #', '#  # ', ' ## #'],
  'R': ['#### ', '#   #', '#   #', '#### ', '# #  ', '#  # ', '#   #'],
  'S': [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
  'T': ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
  'U': ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  'V': ['#   #', '#   #', '#   #', '#   #', '#   #', ' # # ', '  #  '],
  'W': ['#   #', '#   #', '#   #', '#   #', '# # #', '## ##', '#   #'],
  'X': ['#   #', '#   #', ' # # ', '  #  ', ' # # ', '#   #', '#   #'],
  'Y': ['#   #', '#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  '],
  'Z': ['#####', '    #', '   # ', '  #  ', ' #   ', '#    ', '#####'],
  '0': [' ### ', '#   #', '#  ##', '# # #', '##  #', '#   #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  '2': [' ### ', '#   #', '    #', '   # ', '  #  ', ' #   ', '#####'],
  '3': [' ### ', '#   #', '    #', '  ## ', '    #', '#   #', ' ### '],
  '4': ['   ##', '  # #', ' #  #', '#   #', '#####', '    #', '    #'],
  '5': ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '],
  '6': [' ### ', '#   #', '#    ', '#### ', '#   #', '#   #', ' ### '],
  '7': ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '],
  '8': [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '],
  '9': [' ### ', '#   #', '#   #', ' ####', '    #', '#   #', ' ### '],
  ' ': ['     ', '     ', '     ', '     ', '     ', '     ', '     '],
  '.': ['     ', '     ', '     ', '     ', '     ', '  #  ', '  #  '],
  ',': ['     ', '     ', '     ', '     ', '  #  ', '  #  ', ' #   '],
  ':': ['     ', '  #  ', '  #  ', '     ', '  #  ', '  #  ', '     '],
  '!': ['  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '     ', '  #  '],
  '?': [' ### ', '#   #', '    #', '   # ', '  #  ', '     ', '  #  '],
  "'": ['  #  ', '  #  ', '     ', '     ', '     ', '     ', '     '],
  '-': ['     ', '     ', '     ', ' ### ', '     ', '     ', '     '],
  '/': ['    #', '    #', '   # ', '  #  ', ' #   ', '#    ', '#    '],
  '·': ['     ', '     ', '     ', '  #  ', '     ', '     ', '     '],
};

export function drawText(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  color: string = PAL.paper,
  scale: number = 1,
): void {
  ctx.save();
  ctx.fillStyle = color;
  const up = str.toUpperCase();
  let cx = x;
  for (let i = 0; i < up.length; i++) {
    const glyph = FONT_DATA[up[i]] ?? FONT_DATA['?'];
    for (let row = 0; row < glyph.length; row++) {
      const line = glyph[row];
      for (let col = 0; col < line.length; col++) {
        if (line[col] === '#') ctx.fillRect(cx + col * scale, y + row * scale, scale, scale);
      }
    }
    cx += 6 * scale;
  }
  ctx.restore();
}

export function textWidth(str: string, scale = 1): number {
  return str.length * 6 * scale;
}

/* ============================================================ */
/* boot                                                         */
/* ============================================================ */

let booted = false;

export function boot(): void {
  if (booted) return;
  buildTiles();

  // Player — RBY-inspired trainer: red cap, white-trimmed red jacket,
  // dark pants, brown boots. Brand-consistent with the portfolio's fire-red.
  buildCharacter('player', {
    cap: PAL.fire,            // red cap crown
    capDark: '#a32413',       // darker red for brim shadow
    hair: '#3a2a1a',          // brown sideburns peeking
    skin: '#f0c6a8',
    skinDark: '#d6a787',
    jacket: PAL.fire,         // red jacket matching cap
    jacketTrim: '#ffffff',    // bright white trim/zipper — RBY signature
    jacketDark: '#8c1a0a',    // shaded jacket side
    pants: '#2a2438',         // dark indigo pants
    boots: '#3a2a1a',         // brown boots
  });

  // Trainer-class NPC variants — each gets a distinctive silhouette so the
  // player can tell them apart at a glance, the RBY way.
  buildCharacter('npc-overlay', {
    cap: '#3858a8',           // blue cap — Hiker / Sailor influence
    capDark: '#1f3978',
    hair: '#1d2a40',
    skin: '#e8b890',
    skinDark: '#ca9a74',
    jacket: PAL.water,
    jacketTrim: '#bce0ff',
    jacketDark: PAL.waterDim,
    pants: '#23222e',
    boots: '#1a1626',
  });
  buildCharacter('npc-gamehook', {
    cap: PAL.bronze,          // worker hat
    capDark: '#7a4f15',
    hair: '#1f1c14',
    skin: '#f0c6a8',
    skinDark: '#d6a787',
    jacket: PAL.gold,
    jacketTrim: '#fff0c0',
    jacketDark: PAL.bronze,
    pants: '#2e2a22',
    boots: '#1a1626',
  });
  buildCharacter('npc-hyperframes', {
    cap: PAL.violet,          // psychic-trainer purple
    capDark: '#6f5ac4',
    hair: '#2e2438',
    skin: '#e2ae8c',
    skinDark: '#c49070',
    jacket: PAL.violet,
    jacketTrim: '#e8dcff',
    jacketDark: '#6f5ac4',
    pants: '#23222e',
    boots: '#1a1626',
  });
  buildCharacter('npc-ahshuckie', {
    cap: '#3aa890',           // teal scientist cap
    capDark: '#1f5e50',
    hair: '#1b3a3a',
    skin: '#f0c6a8',
    skinDark: '#d6a787',
    jacket: PAL.plasma,
    jacketTrim: '#ffffff',
    jacketDark: '#3aa890',
    pants: '#23222e',
    boots: '#1a1626',
  });
  buildCharacter('npc-poker', {
    cap: '#1a1626',           // black dealer's cap
    capDark: '#0a0a12',
    hair: '#3a1a0c',
    skin: '#e8b890',
    skinDark: '#ca9a74',
    jacket: '#8c2333',
    jacketTrim: '#ffd24c',
    jacketDark: '#611724',
    pants: '#23222e',
    boots: '#1a1626',
  });
  buildCharacter('npc-contact', {
    cap: PAL.bone,
    capDark: '#c9b890',
    hair: '#2a1808',
    skin: '#f0c6a8',
    skinDark: '#d6a787',
    jacket: PAL.bone,
    jacketTrim: '#ffffff',
    jacketDark: '#c9b890',
    pants: '#3a3424',
    boots: '#1a1626',
  });

  // trees — RBY-style squat for interior, plus tall round/pine for borders
  buildTree('tree-round', 'round');
  buildTree('tree-pine', 'pine');
  buildTree('tree-squat', 'rby-squat');

  buildFountain();
  buildLamp();
  buildBush(false);
  buildBush(true);
  buildFlowerbed();

  // buildings
  buildBuilding('bld-overlay', { wTiles: 6, hTiles: 5, roof: '#c12911', roofDark: '#8c1c0a', accent: PAL.water, prop: 'flags' });
  buildBuilding('bld-gamehook', { wTiles: 6, hTiles: 5, roof: '#a37a14', roofDark: '#7a5a0e', accent: PAL.gold, prop: 'antenna' });
  buildBuilding('bld-hyperframes', { wTiles: 6, hTiles: 5, roof: '#5d4a99', roofDark: '#443670', accent: PAL.violet, prop: 'reel' });
  buildBuilding('bld-ahshuckie', { wTiles: 6, hTiles: 5, roof: '#246b6b', roofDark: '#194c4c', accent: PAL.plasma, prop: 'none' });
  buildBuilding('bld-poker', { wTiles: 6, hTiles: 5, roof: '#8c2333', roofDark: '#611724', accent: PAL.fire, prop: 'neon' });
  buildBuilding('bld-contact', { wTiles: 6, hTiles: 6, roof: '#a37a14', roofDark: '#7a5a0e', accent: PAL.gold, prop: 'orb' });
  buildBuilding('bld-house', { wTiles: 5, hTiles: 5, roof: '#246b6b', roofDark: '#194c4c', accent: PAL.paper, prop: 'chimney' });
  buildBuilding('bld-archive', { wTiles: 8, hTiles: 5, roof: '#7a5a0e', roofDark: '#5c440b', accent: PAL.bronze, prop: 'columns' });

  booted = true;
}
