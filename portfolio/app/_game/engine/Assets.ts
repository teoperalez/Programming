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

  // tall grass — 2 frames swaying
  const tall = (lean: number): Painter => (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    const r = rng(57);
    for (let i = 0; i < 10; i++) px(ctx, ox + Math.floor(r() * 16), oy + Math.floor(r() * 16), PAL.grassLight);
    // five blades
    for (let b = 0; b < 5; b++) {
      const bx = ox + 2 + b * 3;
      rect(ctx, bx, oy + 8, 1, 7, PAL.grassDark);
      rect(ctx, bx + lean, oy + 5, 1, 4, PAL.grassDim);
      px(ctx, bx + lean * 2, oy + 4, PAL.grassDim);
    }
  };
  placeTile('tallgrass', [tall(0), tall(1)], 0.7);

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

interface CharColors {
  hair: string;
  hairLight: string;
  jacket: string;
  jacketLight: string;
  jacketDark: string;
  pants: string;
  boots: string;
  skin: string;
  skinShade: string;
  hat?: string;
}

const mirror = (rows: string[]): string[] => rows.map((r) => r.split('').reverse().join(''));

/** Build head rows (9 rows) per facing. Each string is exactly 16 chars. */
function headRows(face: 'down' | 'up' | 'side'): string[] {
  if (face === 'down') {
    return [
      '.....oooooo.....',
      '....ohhhhhhho...',
      '...ohhHHHHHhho..',
      '...ohhhhhhhhho..',
      '...ohssssssho...',
      '...oseSssSseo...',
      '...osssssssso...',
      '....ossseeso....',
      '.....oSSSSo.....',
    ];
  }
  if (face === 'up') {
    return [
      '.....oooooo.....',
      '....ohhhhhhho...',
      '...ohHHHHHHHho..',
      '...ohhhhhhhhho..',
      '...ohhhhhhhhho..',
      '...ohhhhhhhhho..',
      '...ohhhhhhhhho..',
      '....ohhhhhhho...',
      '.....ohhhhho....',
    ];
  }
  // side — right-facing (col index 2, mirror to face left)
  return [
    '.....oooooo.....',
    '....ohhhhhhho...',
    '...ohhHHHHhhho..',
    '...ohhhhhhhhho..',
    '...ohsssssso....',
    '...ohSeeesso....',
    '...ohssssso.....',
    '....ossssSo.....',
    '.....ossso......',
  ];
}

/** Torso rows (8 rows) per facing. */
function torsoRows(face: 'down' | 'up' | 'side'): string[] {
  if (face === 'down') {
    return [
      '....odjjjjjdo...',
      '...ojJjjjjjJjo..',
      '..ojJjjddjjjJo..',
      '..ojjjdJJdjjjo..',
      '..osjjdJJdjjso..',
      '..osjjdjjdjjso..',
      '...ojjjjjjjjo...',
      '...oddddddddo...',
    ];
  }
  if (face === 'up') {
    return [
      '....odddddddo...',
      '...odjjjjjjjdo..',
      '..odjjjjjjjjjdo.',
      '..odjjjjjjjjjdo.',
      '..osjjjjjjjjso..',
      '..osjjjjjjjjso..',
      '...ojjjjjjjjo...',
      '...oddddddddo...',
    ];
  }
  // side
  return [
    '....odjjjjjdo...',
    '....ojJjjjjjo...',
    '...ojJjjjjjjo...',
    '...ojjjdjjjjo...',
    '...ojsjdjjjso...',
    '...ojsjdjjjso...',
    '....ojjjjjjo....',
    '....oddddddo....',
  ];
}

/** Leg rows (7 rows): stand / stepA / stepB. Each row exactly 16 chars. */
function legRows(variant: 'stand' | 'a' | 'b', face: 'down' | 'up' | 'side'): string[] {
  if (face === 'side') {
    if (variant === 'stand') {
      return [
        '....opppppppo...',
        '....opppppppo...',
        '....oppppppo....',
        '.....oppppo.....',
        '.....obbbbo.....',
        '.....obbbbo.....',
        '......oooo......',
      ];
    }
    if (variant === 'a') {
      return [
        '....opppppppo...',
        '....opppppppo...',
        '...oppoooppo....',
        '..oppo..oppo....',
        '..obbo..obbo....',
        '..ooo....ooo....',
        '................',
      ];
    }
    return [
      '....opppppppo...',
      '....opppppppo...',
      '....oppoopppo...',
      '....oppo.oppoo..',
      '....obboo.obbo..',
      '....oooo..oooo..',
      '................',
    ];
  }
  // down / up share leg silhouettes (front + back legs touch)
  if (variant === 'stand') {
    return [
      '....opppppppo...',
      '....opppppppo...',
      '....opp..ppo....',
      '....opp..ppo....',
      '....obb..bbo....',
      '....obb..bbo....',
      '.....oo..oo.....',
    ];
  }
  if (variant === 'a') {
    return [
      '....opppppppo...',
      '....opppppppo...',
      '...oppo..ppo....',
      '..oppo..oppo....',
      '..obbo..obbo....',
      '..ooo....ooo....',
      '................',
    ];
  }
  return [
    '....opppppppo...',
    '....opppppppo...',
    '....oppo.oppo...',
    '....oppoooppo...',
    '....obbo.obboo..',
    '....oooo..oooo..',
    '................',
  ];
}

function charMap(c: CharColors): Record<string, string> {
  return {
    o: PAL.outline,
    h: c.hat ?? c.hair,
    H: c.hat ? c.hat : c.hairLight,
    s: c.skin,
    S: c.skinShade,
    e: PAL.outline,
    j: c.jacket,
    J: c.jacketLight,
    d: c.jacketDark,
    p: c.pants,
    b: c.boots,
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
      let rows = [...headRows(face), ...torsoRows(face), ...legRows(variant, face)];
      if (flip) rows = mirror(rows);
      paintGrid(ctx, col * FW, row * FH, rows, map);
    });
  });

  sprites.set(id, { canvas: cv, frame: { w: FW, h: FH }, cols: 4, rows: 3 });
}

/* ---- trees (16×32, walk-behind canopy) ---- */

function buildTree(id: string, kind: 'round' | 'pine'): void {
  const cv = document.createElement('canvas');
  cv.width = 16;
  cv.height = 32;
  const ctx = cv.getContext('2d')!;
  if (kind === 'round') {
    paintGrid(ctx, 0, 0, [
      '....oooooo......',
      '..oo GGGG oo....'.replace(/ /g, 'g'),
      '.ogGGGGGGGGo....',
      '.ogGGgggGGGgo...',
      'ogGGggggggGGgo..',
      'ogGgggggggggGo..',
      'ogggggggggggGo..',
      'ogggdggggdgggo..',
      '.ogggggdggggo...',
      '.odggggggggdo...',
      '..oddggggddo....',
      '...oddddddo.....',
      '....obbddo......',
      '.....obbo.......',
      '.....obbo.......',
      '.....obbo.......',
    ], {
      o: PAL.outline, G: PAL.grassLight, g: PAL.grass, d: PAL.grassDim, b: '#6b4226', B: '#4e2f1a',
    });
    // trunk lower half (rows 16-31)
    paintGrid(ctx, 0, 16, [
      '.....obbo.......',
      '....obbbbo......',
      '....obBbbo......',
      '....obBbbo......',
      '....obbbbo......',
      '...ooBbbBoo.....',
      '..o.oooooo.o....',
      '................',
    ], { o: PAL.outline, b: '#6b4226', B: '#4e2f1a' });
    // ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(7.5, 23, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
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
      '......obbo......',
    ], { o: PAL.outline, G: PAL.grassLight, g: PAL.grassDim, d: PAL.grassDark, b: '#6b4226' });
    paintGrid(ctx, 0, 16, [
      '......obbo......',
      '.....obbbbo.....',
      '.....obBbbo.....',
      '.....obbbbo.....',
      '....ooooooo.....',
      '................',
      '................',
      '................',
    ], { o: PAL.outline, b: '#6b4226', B: '#4e2f1a' });
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

  const roofH = Math.floor(H * 0.32);

  // ---- walls: plaster with base trim and corner quoins ----
  rect(ctx, 0, roofH, W, H - roofH, PAL.plaster);
  rect(ctx, 0, roofH, W, 2, 'rgba(0,0,0,0.28)'); // eave shadow
  rect(ctx, 0, H - 5, W, 5, PLASTER_SHADE);
  rect(ctx, 0, H - 2, W, 2, PAL.outline);
  // quoins
  for (let y = roofH + 3; y < H - 5; y += 5) {
    rect(ctx, 0, y, 3, 3, PLASTER_SHADE);
    rect(ctx, W - 3, y, 3, 3, PLASTER_SHADE);
  }
  // wall texture flecks
  const r = rng(id.length * 31);
  for (let i = 0; i < W / 2; i++) {
    px(ctx, Math.floor(r() * W), roofH + 3 + Math.floor(r() * (H - roofH - 9)), 'rgba(0,0,0,0.05)');
  }

  // ---- roof: shingle rows with ridge ----
  rect(ctx, 0, 0, W, roofH, st.roof);
  for (let y = 3; y < roofH; y += 4) {
    rect(ctx, 0, y, W, 1, st.roofDark);
    for (let x = ((y / 4) % 2) * 4; x < W; x += 8) {
      px(ctx, x, y - 1, st.roofDark);
    }
  }
  rect(ctx, 0, 0, W, 2, PAL.outline);
  rect(ctx, 0, 2, W, 1, 'rgba(255,255,255,0.25)');
  // eaves overhang
  rect(ctx, -1, roofH - 3, W + 2, 3, st.roofDark);
  rect(ctx, 0, roofH - 1, W, 1, PAL.outline);

  // ---- door: arched, centered, with steps ----
  const dx = Math.floor(W / 2) - 9;
  const doorW = 18, doorH = 26;
  const dy = H - doorH - 2;
  // arch outline
  rect(ctx, dx - 1, dy - 1, doorW + 2, doorH + 1, PAL.outline);
  ctx.fillStyle = PAL.outline;
  ctx.fillRect(dx + 1, dy - 3, doorW - 2, 2);
  // frame
  rect(ctx, dx, dy, doorW, doorH, PAL.brickDark);
  rect(ctx, dx + 2, dy - 1, doorW - 4, 2, PAL.brickDark);
  // door leaf
  rect(ctx, dx + 2, dy + 2, doorW - 4, doorH - 4, PAL.bronze);
  rect(ctx, dx + 2, dy + 2, doorW - 4, 2, PAL.gold);
  rect(ctx, dx + 8, dy + 2, 2, doorH - 4, PAL.brickDark); // double-door split
  px(ctx, dx + 6, dy + 13, PAL.gold);
  px(ctx, dx + 11, dy + 13, PAL.gold);
  // glow from inside (under door)
  rect(ctx, dx + 2, H - 4, doorW - 4, 2, 'rgba(255,184,0,0.5)');
  // steps
  rect(ctx, dx - 2, H - 2, doorW + 4, 2, PAL.fog);

  // ---- windows: framed, lit, two-tone glow + reflection slash ----
  const winY = roofH + 8;
  const winW = 14, winH = 14;
  const drawWindow = (wx: number) => {
    rect(ctx, wx - 1, winY - 1, winW + 2, winH + 2, PAL.outline);
    rect(ctx, wx, winY, winW, winH, PAL.brickDark);
    rect(ctx, wx + 1, winY + 1, winW - 2, winH - 2, '#ffd27a');
    rect(ctx, wx + 1, winY + 1, winW - 2, 5, '#ffe9b8');
    // mullions
    rect(ctx, wx + winW / 2 - 1, winY, 2, winH, PAL.brickDark);
    rect(ctx, wx, winY + winH / 2 - 1, winW, 2, PAL.brickDark);
    // reflection slash
    px(ctx, wx + 2, winY + 2, '#ffffff');
    px(ctx, wx + 3, winY + 3, '#ffffff');
    // sill
    rect(ctx, wx - 2, winY + winH + 1, winW + 4, 2, PLASTER_SHADE);
    rect(ctx, wx - 2, winY + winH + 3, winW + 4, 1, 'rgba(0,0,0,0.2)');
  };
  drawWindow(7);
  drawWindow(W - 7 - winW);

  // ---- sign band ----
  const signW = Math.min(W - 16, 64);
  const sx = Math.floor(W / 2 - signW / 2);
  const sy = roofH + 2;
  rect(ctx, sx - 1, sy - 1, signW + 2, 12, PAL.outline);
  rect(ctx, sx, sy, signW, 10, st.accent);
  rect(ctx, sx, sy, signW, 2, 'rgba(255,255,255,0.35)');
  rect(ctx, sx, sy + 8, signW, 2, 'rgba(0,0,0,0.3)');

  // ---- per-building props ----
  switch (st.prop) {
    case 'antenna': {
      const ax = W - 14;
      rect(ctx, ax, -0, 2, 2, PAL.outline);
      rect(ctx, ax, 0, 1, 14, PAL.fog);
      rect(ctx, ax - 3, 3, 7, 1, PAL.fog);
      rect(ctx, ax - 2, 6, 5, 1, PAL.fog);
      // blinking light handled by Beacon entity; static base dot:
      px(ctx, ax, 0, PAL.fire);
      break;
    }
    case 'neon': {
      // neon border around sign
      for (let i = 0; i < signW + 2; i += 2) {
        px(ctx, sx - 1 + i, sy - 2, i % 4 === 0 ? PAL.fire : PAL.gold);
        px(ctx, sx - 1 + i, sy + 11, i % 4 === 0 ? PAL.gold : PAL.fire);
      }
      // card suits on wall
      px(ctx, 5, roofH + 26, PAL.fire);
      px(ctx, W - 6, roofH + 26, PAL.ink);
      break;
    }
    case 'reel': {
      // film reel at sign left
      const cx = sx - 7, cy = sy + 5;
      ctx.fillStyle = PAL.outline;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PAL.fog;
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
        rect(ctx, fx, -0, 1, 8, PAL.fog);
        // triangle pennant
        px(ctx, fx + 1, 0, PAL.fire);
        px(ctx, fx + 2, 0, PAL.fire);
        px(ctx, fx + 3, 0, PAL.fire);
        px(ctx, fx + 1, 1, PAL.fire);
        px(ctx, fx + 2, 1, PAL.fire);
        px(ctx, fx + 1, 2, PAL.fire);
      }
      break;
    }
    case 'chimney': {
      rect(ctx, 8, 0, 8, 10, PAL.outline);
      rect(ctx, 9, 1, 6, 9, PAL.brick);
      rect(ctx, 9, 1, 6, 2, PAL.brickDark);
      rect(ctx, 8, 0, 8, 1, PAL.stone);
      break;
    }
    case 'columns': {
      // classical columns flanking the door
      for (const cx of [dx - 8, dx + doorW + 4]) {
        rect(ctx, cx, roofH + 4, 4, H - roofH - 6, PAL.bone);
        rect(ctx, cx, roofH + 4, 1, H - roofH - 6, '#fff');
        rect(ctx, cx + 3, roofH + 4, 1, H - roofH - 6, PLASTER_SHADE);
        rect(ctx, cx - 1, roofH + 2, 6, 3, PAL.bone);
        rect(ctx, cx - 1, H - 6, 6, 3, PAL.bone);
      }
      break;
    }
    case 'orb': {
      // glowing orb pedestal on roof center (beacon adds the pulse)
      const ox2 = Math.floor(W / 2);
      rect(ctx, ox2 - 2, -0, 4, 4, PAL.outline);
      rect(ctx, ox2 - 1, 0, 2, 3, PAL.gold);
      break;
    }
  }

  // ambient occlusion at wall base
  rect(ctx, 0, H - 6, W, 1, 'rgba(0,0,0,0.12)');

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

  // player — fire-red jacket, brown hair
  buildCharacter('player', {
    hair: '#3a2a1a', hairLight: '#5a4127',
    jacket: PAL.fire, jacketLight: '#ff7a5c', jacketDark: PAL.ember,
    pants: '#23222e', boots: '#3a2a1a',
    skin: '#f0c6a8', skinShade: '#d6a787',
  });

  // NPC variants
  buildCharacter('npc-overlay', {
    hair: '#1d2a40', hairLight: '#2e4366',
    jacket: PAL.water, jacketLight: '#7ab2f7', jacketDark: PAL.waterDim,
    pants: '#23222e', boots: '#1a1626',
    skin: '#e8b890', skinShade: '#ca9a74',
  });
  buildCharacter('npc-gamehook', {
    hair: '#1f1c14', hairLight: '#3a3424',
    jacket: PAL.gold, jacketLight: '#ffd266', jacketDark: PAL.bronze,
    pants: '#2e2a22', boots: '#1a1626',
    skin: '#f0c6a8', skinShade: '#d6a787',
    hat: PAL.bronze,
  });
  buildCharacter('npc-hyperframes', {
    hair: '#2e2438', hairLight: '#473a54',
    jacket: PAL.violet, jacketLight: '#c4b1ff', jacketDark: '#6f5ac4',
    pants: '#23222e', boots: '#1a1626',
    skin: '#e2ae8c', skinShade: '#c49070',
  });
  buildCharacter('npc-ahshuckie', {
    hair: '#1b3a3a', hairLight: '#2c5c5c',
    jacket: PAL.plasma, jacketLight: '#a7f9e4', jacketDark: '#3aa890',
    pants: '#23222e', boots: '#1a1626',
    skin: '#f0c6a8', skinShade: '#d6a787',
  });
  buildCharacter('npc-poker', {
    hair: '#3a1a0c', hairLight: '#5c2c16',
    jacket: '#8c2333', jacketLight: '#b53a4e', jacketDark: '#611724',
    pants: '#23222e', boots: '#1a1626',
    skin: '#e8b890', skinShade: '#ca9a74',
    hat: '#1a1626',
  });
  buildCharacter('npc-contact', {
    hair: '#2a1808', hairLight: '#46300f',
    jacket: PAL.bone, jacketLight: '#fff7e0', jacketDark: '#c9b890',
    pants: '#3a3424', boots: '#1a1626',
    skin: '#f0c6a8', skinShade: '#d6a787',
  });

  // trees
  buildTree('tree-round', 'round');
  buildTree('tree-pine', 'pine');

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
