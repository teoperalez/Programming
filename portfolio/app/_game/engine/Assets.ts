/**
 * Procedural asset generator. Every tile, sprite, and bitmap-font glyph is
 * drawn at boot to an offscreen canvas. No image downloads; the cost is
 * milliseconds of paint time once.
 *
 * Palette is restricted to ~16 colors for a coherent retro feel.
 */

export const TILE_SIZE = 16;

/** Restricted palette — referenced by name across asset code. */
export const PAL = {
  void: '#07070b',
  ink: '#14131b',
  stone: '#2b2a36',
  fog: '#4e4a5c',
  paper: '#f4ecdc',
  paperDim: '#d8cfbe',
  paperMute: '#8a8377',
  fire: '#ff3c25',
  ember: '#b8270f',
  gold: '#ffb800',
  bronze: '#c08029',
  grass: '#6cb53a',
  grassDim: '#3e7e1a',
  water: '#4286f0',
  waterDim: '#2255b8',
  plasma: '#6cf4d2',
  violet: '#a78bff',
  bone: '#efe3c2',
  // structural
  path: '#a08a5e',
  pathDark: '#7d6840',
  brick: '#9c4a2e',
  brickDark: '#6b3220',
  roofRed: '#c12911',
  roofTeal: '#246b6b',
  roofGold: '#a37a14',
  roofViolet: '#5d4a99',
  window: '#1a6db5',
  windowLit: '#ffcb55',
} as const;

export type TileID =
  | 'grass' | 'grass-tuft' | 'grass-flower' | 'grass-dark'
  | 'path' | 'path-edge-n' | 'path-edge-s' | 'path-edge-e' | 'path-edge-w'
  | 'water' | 'water-edge-n' | 'water-edge-s' | 'water-edge-e' | 'water-edge-w'
  | 'sand' | 'rock' | 'tree' | 'fence-h' | 'fence-v' | 'sign' | 'cobble' | 'stairs';

/** Offscreen canvas containing the full tilemap atlas. */
let tileAtlas: HTMLCanvasElement | null = null;
/** Map from tile id to atlas (x,y) in tile units. */
const tileIndex = new Map<TileID, { x: number; y: number }>();

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Lay out tiles in a 8-wide atlas. */
function placeTile(id: TileID, painter: (ctx: CanvasRenderingContext2D, ox: number, oy: number) => void): void {
  if (!tileAtlas) throw new Error('tileAtlas not init');
  const idx = tileIndex.size;
  const tx = idx % 8;
  const ty = Math.floor(idx / 8);
  const ox = tx * TILE_SIZE;
  const oy = ty * TILE_SIZE;
  const ctx = tileAtlas.getContext('2d')!;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, oy, TILE_SIZE, TILE_SIZE);
  ctx.clip();
  painter(ctx, ox, oy);
  ctx.restore();
  tileIndex.set(id, { x: tx, y: ty });
}

function buildTiles(): void {
  // 8 cols × 4 rows = 32 tile slots
  tileAtlas = document.createElement('canvas');
  tileAtlas.width = TILE_SIZE * 8;
  tileAtlas.height = TILE_SIZE * 4;

  // ---- grass ----
  placeTile('grass', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    // subtle hash dots so it doesn't feel flat
    for (let i = 0; i < 6; i++) {
      const x = ox + ((i * 5 + 3) % TILE_SIZE);
      const y = oy + ((i * 7 + 5) % TILE_SIZE);
      px(ctx, x, y, PAL.grassDim);
    }
  });
  placeTile('grass-tuft', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    // little tuft
    px(ctx, ox + 6, oy + 9, PAL.grassDim);
    px(ctx, ox + 7, oy + 8, PAL.grassDim);
    px(ctx, ox + 8, oy + 9, PAL.grassDim);
    px(ctx, ox + 9, oy + 8, PAL.grassDim);
    px(ctx, ox + 7, oy + 10, PAL.grass);
    px(ctx, ox + 8, oy + 10, PAL.grass);
  });
  placeTile('grass-flower', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    px(ctx, ox + 8, oy + 7, PAL.gold);
    px(ctx, ox + 7, oy + 8, PAL.fire);
    px(ctx, ox + 8, oy + 8, PAL.gold);
    px(ctx, ox + 9, oy + 8, PAL.fire);
    px(ctx, ox + 8, oy + 9, PAL.gold);
  });
  placeTile('grass-dark', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grassDim);
    for (let i = 0; i < 5; i++) {
      px(ctx, ox + ((i * 5 + 2) % TILE_SIZE), oy + ((i * 9 + 4) % TILE_SIZE), PAL.grass);
    }
  });

  // ---- path ----
  const drawPathBase = (ctx: CanvasRenderingContext2D, ox: number, oy: number) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.path);
    // subtle stones
    for (let i = 0; i < 4; i++) {
      const x = ox + ((i * 6 + 2) % TILE_SIZE);
      const y = oy + ((i * 5 + 6) % TILE_SIZE);
      px(ctx, x, y, PAL.pathDark);
    }
  };
  placeTile('path', drawPathBase);
  placeTile('path-edge-n', (ctx, ox, oy) => {
    drawPathBase(ctx, ox, oy);
    rect(ctx, ox, oy, TILE_SIZE, 2, PAL.pathDark);
  });
  placeTile('path-edge-s', (ctx, ox, oy) => {
    drawPathBase(ctx, ox, oy);
    rect(ctx, ox, oy + TILE_SIZE - 2, TILE_SIZE, 2, PAL.pathDark);
  });
  placeTile('path-edge-e', (ctx, ox, oy) => {
    drawPathBase(ctx, ox, oy);
    rect(ctx, ox + TILE_SIZE - 2, oy, 2, TILE_SIZE, PAL.pathDark);
  });
  placeTile('path-edge-w', (ctx, ox, oy) => {
    drawPathBase(ctx, ox, oy);
    rect(ctx, ox, oy, 2, TILE_SIZE, PAL.pathDark);
  });

  // ---- water ----
  placeTile('water', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.water);
    for (let i = 0; i < 4; i++) {
      rect(ctx, ox + (i * 4) % TILE_SIZE, oy + 2 + i * 4, 3, 1, PAL.waterDim);
    }
  });
  placeTile('water-edge-n', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.water);
    rect(ctx, ox, oy, TILE_SIZE, 2, PAL.bone);
  });
  placeTile('water-edge-s', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.water);
    rect(ctx, ox, oy + TILE_SIZE - 2, TILE_SIZE, 2, PAL.bone);
  });
  placeTile('water-edge-e', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.water);
    rect(ctx, ox + TILE_SIZE - 2, oy, 2, TILE_SIZE, PAL.bone);
  });
  placeTile('water-edge-w', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.water);
    rect(ctx, ox, oy, 2, TILE_SIZE, PAL.bone);
  });

  // ---- sand, rock, tree, fence, sign, cobble, stairs ----
  placeTile('sand', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.bone);
    for (let i = 0; i < 6; i++) {
      px(ctx, ox + ((i * 7 + 1) % TILE_SIZE), oy + ((i * 5 + 3) % TILE_SIZE), PAL.bronze);
    }
  });
  placeTile('rock', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    rect(ctx, ox + 3, oy + 5, 10, 8, PAL.fog);
    rect(ctx, ox + 4, oy + 6, 8, 6, PAL.stone);
    rect(ctx, ox + 6, oy + 7, 3, 2, PAL.paperMute);
  });
  placeTile('tree', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    // trunk
    rect(ctx, ox + 7, oy + 11, 2, 4, PAL.brickDark);
    // canopy
    rect(ctx, ox + 3, oy + 2, 10, 10, PAL.grassDim);
    rect(ctx, ox + 4, oy + 1, 8, 11, PAL.grassDim);
    rect(ctx, ox + 5, oy + 3, 6, 7, '#4f9728');
    px(ctx, ox + 6, oy + 4, PAL.grass);
    px(ctx, ox + 8, oy + 5, PAL.grass);
    px(ctx, ox + 7, oy + 7, PAL.grass);
  });
  placeTile('fence-h', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    rect(ctx, ox, oy + 7, TILE_SIZE, 2, PAL.bone);
    rect(ctx, ox + 2, oy + 4, 2, 8, PAL.bone);
    rect(ctx, ox + 11, oy + 4, 2, 8, PAL.bone);
  });
  placeTile('fence-v', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    rect(ctx, ox + 7, oy, 2, TILE_SIZE, PAL.bone);
    rect(ctx, ox + 4, oy + 2, 8, 2, PAL.bone);
    rect(ctx, ox + 4, oy + 11, 8, 2, PAL.bone);
  });
  placeTile('sign', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.grass);
    rect(ctx, ox + 7, oy + 8, 2, 6, PAL.brickDark);
    rect(ctx, ox + 3, oy + 3, 10, 7, PAL.bronze);
    rect(ctx, ox + 4, oy + 4, 8, 5, PAL.paper);
    rect(ctx, ox + 5, oy + 5, 2, 1, PAL.ink);
    rect(ctx, ox + 8, oy + 5, 3, 1, PAL.ink);
    rect(ctx, ox + 5, oy + 7, 6, 1, PAL.ink);
  });
  placeTile('cobble', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.stone);
    for (let yy = 0; yy < TILE_SIZE; yy += 4) {
      for (let xx = 0; xx < TILE_SIZE; xx += 4) {
        const ox2 = ox + xx + (yy / 4 % 2 ? 2 : 0);
        if (ox2 + 2 < ox + TILE_SIZE) rect(ctx, ox2, oy + yy, 2, 2, PAL.fog);
      }
    }
  });
  placeTile('stairs', (ctx, ox, oy) => {
    rect(ctx, ox, oy, TILE_SIZE, TILE_SIZE, PAL.stone);
    rect(ctx, ox, oy + 4, TILE_SIZE, 1, PAL.fog);
    rect(ctx, ox, oy + 9, TILE_SIZE, 1, PAL.fog);
    rect(ctx, ox, oy + 14, TILE_SIZE, 1, PAL.fog);
  });
}

export function tileSource(id: TileID): { atlas: HTMLCanvasElement; sx: number; sy: number; sw: number; sh: number } {
  if (!tileAtlas) throw new Error('Assets not booted');
  const pos = tileIndex.get(id);
  if (!pos) throw new Error('unknown tile ' + id);
  return { atlas: tileAtlas, sx: pos.x * TILE_SIZE, sy: pos.y * TILE_SIZE, sw: TILE_SIZE, sh: TILE_SIZE };
}

/* ============================================================ */
/* SPRITES — characters, building facades                       */
/* ============================================================ */

export interface SpriteSheet {
  canvas: HTMLCanvasElement;
  frame: { w: number; h: number };
  cols: number;
}

const sprites = new Map<string, SpriteSheet>();

export function getSprite(id: string): SpriteSheet {
  const s = sprites.get(id);
  if (!s) throw new Error('unknown sprite ' + id);
  return s;
}

/** Player sprite: 4 directions × 2 walk frames, 16x24. */
function buildPlayer(): void {
  const FW = 16, FH = 24;
  const cv = document.createElement('canvas');
  cv.width = FW * 4;
  cv.height = FH * 2;
  const ctx = cv.getContext('2d')!;

  type Body = { hair: string; jacket: string; jacketDark: string; pants: string };
  const body: Body = {
    hair: '#3a2a1a',
    jacket: PAL.fire,
    jacketDark: PAL.ember,
    pants: PAL.ink,
  };

  // shared head — 8w × 8h centered
  const drawHead = (ox: number, oy: number) => {
    // skin
    rect(ctx, ox + 4, oy + 2, 8, 7, '#f0c6a8');
    // hair top
    rect(ctx, ox + 3, oy + 1, 10, 3, body.hair);
    rect(ctx, ox + 4, oy + 0, 8, 1, body.hair);
    // hair sides drop
    rect(ctx, ox + 3, oy + 4, 1, 2, body.hair);
    rect(ctx, ox + 12, oy + 4, 1, 2, body.hair);
    // eyes
    px(ctx, ox + 6, oy + 5, PAL.ink);
    px(ctx, ox + 10, oy + 5, PAL.ink);
    // mouth
    px(ctx, ox + 8, oy + 7, PAL.ember);
    // neck
    rect(ctx, ox + 6, oy + 9, 4, 1, '#d6a787');
  };

  const drawBodyFront = (ox: number, oy: number, walkLeg: 0 | 1) => {
    // jacket
    rect(ctx, ox + 3, oy + 10, 10, 7, body.jacket);
    rect(ctx, ox + 3, oy + 10, 10, 1, body.jacketDark);
    // zipper
    rect(ctx, ox + 7, oy + 11, 2, 5, body.jacketDark);
    // pants
    rect(ctx, ox + 4, oy + 17, 8, 5, body.pants);
    // legs split when walking
    if (walkLeg === 0) {
      rect(ctx, ox + 4, oy + 22, 3, 2, PAL.ink);
      rect(ctx, ox + 9, oy + 22, 3, 1, PAL.ink);
    } else {
      rect(ctx, ox + 4, oy + 22, 3, 1, PAL.ink);
      rect(ctx, ox + 9, oy + 22, 3, 2, PAL.ink);
    }
  };
  const drawBodyBack = (ox: number, oy: number, walkLeg: 0 | 1) => {
    // hood/back
    rect(ctx, ox + 3, oy + 10, 10, 7, body.jacketDark);
    rect(ctx, ox + 4, oy + 10, 8, 1, body.jacket);
    rect(ctx, ox + 4, oy + 17, 8, 5, body.pants);
    if (walkLeg === 0) {
      rect(ctx, ox + 4, oy + 22, 3, 2, PAL.ink);
      rect(ctx, ox + 9, oy + 22, 3, 1, PAL.ink);
    } else {
      rect(ctx, ox + 4, oy + 22, 3, 1, PAL.ink);
      rect(ctx, ox + 9, oy + 22, 3, 2, PAL.ink);
    }
  };
  const drawBodySide = (ox: number, oy: number, walkLeg: 0 | 1, flipped: boolean) => {
    // single-arm-side jacket
    rect(ctx, ox + 4, oy + 10, 8, 7, body.jacket);
    rect(ctx, ox + 4, oy + 10, 8, 1, body.jacketDark);
    rect(ctx, ox + 5, oy + 17, 6, 5, body.pants);
    // legs animate
    if (walkLeg === 0) {
      rect(ctx, ox + 5, oy + 22, 2, 2, PAL.ink);
    } else {
      rect(ctx, ox + 9, oy + 22, 2, 2, PAL.ink);
    }
    // arm hint
    const armX = flipped ? ox + 11 : ox + 4;
    rect(ctx, armX, oy + 12, 1, 4, body.jacketDark);
  };

  // ROW 0: idle frames (down, up, left, right)
  drawHead(0 * FW, 0); drawBodyFront(0 * FW, 0, 0);
  drawHead(1 * FW, 0); drawBodyBack(1 * FW, 0, 0);
  drawHead(2 * FW, 0); drawBodySide(2 * FW, 0, 0, false);
  drawHead(3 * FW, 0); drawBodySide(3 * FW, 0, 0, true);

  // ROW 1: walk frames
  drawHead(0 * FW, FH); drawBodyFront(0 * FW, FH, 1);
  drawHead(1 * FW, FH); drawBodyBack(1 * FW, FH, 1);
  drawHead(2 * FW, FH); drawBodySide(2 * FW, FH, 1, false);
  drawHead(3 * FW, FH); drawBodySide(3 * FW, FH, 1, true);

  sprites.set('player', { canvas: cv, frame: { w: FW, h: FH }, cols: 4 });
}

/** NPC sprite generator — bodyColor is the jacket. */
function buildNPC(id: string, jacket: string, hair: string): void {
  const FW = 16, FH = 24;
  const cv = document.createElement('canvas');
  cv.width = FW * 4;
  cv.height = FH * 2;
  const ctx = cv.getContext('2d')!;
  const dark = jacket === PAL.fire ? PAL.ember : '#222';
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const ox = col * FW, oy = row * FH;
      // head
      rect(ctx, ox + 4, oy + 2, 8, 7, '#f0c6a8');
      rect(ctx, ox + 3, oy + 1, 10, 3, hair);
      rect(ctx, ox + 4, oy + 0, 8, 1, hair);
      px(ctx, ox + 6, oy + 5, PAL.ink);
      px(ctx, ox + 10, oy + 5, PAL.ink);
      px(ctx, ox + 8, oy + 7, PAL.ember);
      rect(ctx, ox + 6, oy + 9, 4, 1, '#d6a787');
      // body
      rect(ctx, ox + 3, oy + 10, 10, 7, jacket);
      rect(ctx, ox + 3, oy + 10, 10, 1, dark);
      rect(ctx, ox + 4, oy + 17, 8, 5, PAL.ink);
      if (row === 0) {
        rect(ctx, ox + 4, oy + 22, 3, 2, PAL.ink);
        rect(ctx, ox + 9, oy + 22, 3, 1, PAL.ink);
      } else {
        rect(ctx, ox + 4, oy + 22, 3, 1, PAL.ink);
        rect(ctx, ox + 9, oy + 22, 3, 2, PAL.ink);
      }
    }
  }
  sprites.set(id, { canvas: cv, frame: { w: FW, h: FH }, cols: 4 });
}

/** Building sprite. Width = w tiles, height = h tiles. roof determines accent. */
function buildBuilding(id: string, wTiles: number, hTiles: number, roof: string, sign: string): void {
  const W = wTiles * TILE_SIZE;
  const H = hTiles * TILE_SIZE;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;

  // wall
  rect(ctx, 0, 8, W, H - 8, PAL.brick);
  // brick pattern
  for (let yy = 12; yy < H - 4; yy += 4) {
    for (let xx = 0; xx < W; xx += 8) {
      const ox = (yy / 4) % 2 ? xx : xx + 4;
      rect(ctx, ox, yy, 1, 1, PAL.brickDark);
      rect(ctx, ox + 3, yy, 1, 1, PAL.brickDark);
    }
  }
  // base
  rect(ctx, 0, H - 4, W, 4, PAL.brickDark);

  // roof
  rect(ctx, 0, 0, W, 10, roof);
  rect(ctx, -2, 8, W + 4, 4, roof);
  rect(ctx, 0, 0, W, 2, PAL.ink);

  // sign band
  rect(ctx, W / 2 - 28, 14, 56, 10, sign);
  rect(ctx, W / 2 - 28, 14, 56, 2, PAL.ink);
  rect(ctx, W / 2 - 28, 22, 56, 2, PAL.ink);

  // door
  const dx = Math.floor(W / 2) - 8;
  rect(ctx, dx, H - 22, 16, 22, PAL.brickDark);
  rect(ctx, dx + 2, H - 20, 12, 18, PAL.bronze);
  rect(ctx, dx + 6, H - 18, 4, 6, PAL.gold);

  // windows
  const winW = 12, winH = 10;
  const winY = H - 38;
  rect(ctx, 8, winY, winW, winH, PAL.windowLit);
  rect(ctx, 9, winY + 1, winW - 2, winH - 2, PAL.window);
  rect(ctx, 8 + winW / 2 - 1, winY, 2, winH, PAL.brickDark);
  rect(ctx, 8, winY + winH / 2 - 1, winW, 2, PAL.brickDark);
  // mirrored on right
  const wx2 = W - 8 - winW;
  rect(ctx, wx2, winY, winW, winH, PAL.windowLit);
  rect(ctx, wx2 + 1, winY + 1, winW - 2, winH - 2, PAL.window);
  rect(ctx, wx2 + winW / 2 - 1, winY, 2, winH, PAL.brickDark);
  rect(ctx, wx2, winY + winH / 2 - 1, winW, 2, PAL.brickDark);

  sprites.set(id, { canvas: cv, frame: { w: W, h: H }, cols: 1 });
}

/** Tiny 6×8 bitmap font drawn at runtime — only the glyphs used in UI. */
const FONT_DATA: Record<string, string[]> = {
  // each glyph is 5 wide × 7 tall, '#' = pixel
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

/** Draw a pixel-font string into the given context, color tinted. */
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
    const ch = up[i];
    const glyph = FONT_DATA[ch] ?? FONT_DATA['?'];
    for (let row = 0; row < glyph.length; row++) {
      const line = glyph[row];
      for (let col = 0; col < line.length; col++) {
        if (line[col] === '#') {
          ctx.fillRect(cx + col * scale, y + row * scale, scale, scale);
        }
      }
    }
    cx += 6 * scale;
  }
  ctx.restore();
}

/** Width of pixel-text in pixels (incl. trailing kerning). */
export function textWidth(str: string, scale = 1): number {
  return str.length * 6 * scale;
}

let booted = false;

export function boot(): void {
  if (booted) return;
  buildTiles();

  buildPlayer();

  // NPCs — colored variants
  buildNPC('npc-overlay', PAL.water, '#2a1d10');
  buildNPC('npc-gamehook', PAL.gold, '#1f1c14');
  buildNPC('npc-hyperframes', PAL.violet, '#2e2438');
  buildNPC('npc-ahshuckie', PAL.plasma, '#1b3a3a');
  buildNPC('npc-poker', PAL.fire, '#3a1a0c');
  buildNPC('npc-contact', PAL.bone, '#2a1808');

  // Buildings (sized in tiles)
  buildBuilding('bld-overlay', 6, 5, PAL.roofRed, PAL.water);
  buildBuilding('bld-gamehook', 6, 5, PAL.roofGold, PAL.gold);
  buildBuilding('bld-hyperframes', 6, 5, PAL.roofViolet, PAL.violet);
  buildBuilding('bld-ahshuckie', 6, 5, PAL.roofTeal, PAL.plasma);
  buildBuilding('bld-poker', 6, 5, PAL.roofRed, PAL.fire);
  buildBuilding('bld-contact', 6, 6, PAL.roofGold, PAL.gold);
  buildBuilding('bld-house', 5, 5, PAL.roofTeal, PAL.paper);
  buildBuilding('bld-archive', 8, 5, PAL.roofGold, PAL.bronze);

  booted = true;
}
