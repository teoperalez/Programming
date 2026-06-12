/**
 * Static-world entities: buildings (large facade sprites) and NPCs (4-dir
 * sprite, optional patrol path). Both are interactable.
 */

import { TILE_SIZE, getSprite, drawText, PAL } from './Assets';
import type { Dir, Interactable, Rect, WorldRenderable } from './types';
import type { Tilemap } from './Tilemap';
import { bus } from './EventBus';

export interface BuildingDef {
  id: string;
  /** Sprite id (built by Assets.boot()). */
  sprite: string;
  /** Tile coordinates of the building's top-left footprint. */
  tx: number;
  ty: number;
  label: string;
  /** Optional sub-label drawn under the main label. */
  sublabel?: string;
  /** Called when the player interacts at the door. */
  onEnter: () => void;
}

/** A building facade. The door is centered along the bottom edge. */
export class Building implements WorldRenderable, Interactable {
  readonly id: string;
  readonly label: string;
  readonly sublabel?: string;
  readonly sprite: string;
  readonly tx: number;
  readonly ty: number;
  private onEnterCb: () => void;

  constructor(def: BuildingDef) {
    this.id = def.id;
    this.sprite = def.sprite;
    this.tx = def.tx;
    this.ty = def.ty;
    this.label = def.label;
    this.sublabel = def.sublabel;
    this.onEnterCb = def.onEnter;
  }

  /** World-space bounds. */
  bounds(): Rect {
    const sheet = getSprite(this.sprite);
    return {
      x: this.tx * TILE_SIZE,
      y: this.ty * TILE_SIZE,
      w: sheet.frame.w,
      h: sheet.frame.h,
    };
  }

  /** Door rectangle at bottom-center. */
  doorRect(): Rect {
    const b = this.bounds();
    return { x: b.x + b.w / 2 - 12, y: b.y + b.h - 4, w: 24, h: 14 };
  }

  /** Interactable AABB is the door + a tile of approach below. */
  interactBounds(): Rect {
    const d = this.doorRect();
    return { x: d.x, y: d.y, w: d.w, h: d.h + TILE_SIZE };
  }

  interact(): void {
    bus.emit('audio:play', { sound: 'open' });
    this.onEnterCb();
  }

  /** Stamp solid tiles for the building's full footprint into the tilemap. */
  stamp(tilemap: Tilemap): void {
    const sheet = getSprite(this.sprite);
    const wT = Math.ceil(sheet.frame.w / TILE_SIZE);
    const hT = Math.ceil(sheet.frame.h / TILE_SIZE);
    for (let dy = 0; dy < hT; dy++) {
      for (let dx = 0; dx < wT; dx++) {
        // last row is the entrance — leave centre 2 tiles non-solid as the door
        const isLastRow = dy === hT - 1;
        const isDoorCol = dx >= Math.floor(wT / 2) - 1 && dx <= Math.floor(wT / 2);
        if (isLastRow && isDoorCol) continue;
        const tx = this.tx + dx;
        const ty = this.ty + dy;
        if (tilemap.inBounds(tx, ty)) tilemap.solid[tilemap.idx(tx, ty)] = true;
      }
    }
  }

  get sortY(): number {
    return this.ty * TILE_SIZE + getSprite(this.sprite).frame.h - 4;
  }

  draw(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; scale: number }): void {
    const sheet = getSprite(this.sprite);
    const dx = Math.round((this.tx * TILE_SIZE - cam.x) * cam.scale);
    const dy = Math.round((this.ty * TILE_SIZE - cam.y) * cam.scale);
    ctx.drawImage(sheet.canvas, 0, 0, sheet.frame.w, sheet.frame.h, dx, dy, sheet.frame.w * cam.scale, sheet.frame.h * cam.scale);

    // sign text — drawn at the building's sign band (y = 16..24 inside sprite)
    const signCenter = dx + (sheet.frame.w * cam.scale) / 2;
    const signY = dy + 16 * cam.scale + 2;
    const pixelScale = Math.max(1, Math.floor(cam.scale * 0.5));
    const txt = this.label.toUpperCase();
    const w = txt.length * 6 * pixelScale;
    drawText(ctx, txt, signCenter - w / 2, signY, PAL.paper, pixelScale);
  }
}

export interface NPCDef {
  id: string;
  sprite: string;
  /** spawn tile */
  tx: number;
  ty: number;
  label?: string;
  facing?: Dir;
  /** Optional patrol — list of tile coords; NPC walks to each in order. */
  patrol?: Array<{ tx: number; ty: number }>;
  /** Dialog lines played on interact. */
  lines: string[];
  /** Optional flag to set on first interaction (for quest log). */
  flag?: string;
}

export class NPC implements WorldRenderable, Interactable {
  readonly id: string;
  readonly sprite: string;
  x: number;
  y: number;
  dir: Dir;
  label?: string;
  private patrol?: Array<{ tx: number; ty: number }>;
  private patrolIdx = 0;
  private animT = 0;
  private waitT = 0;
  private lines: string[];
  private flag?: string;

  constructor(def: NPCDef) {
    this.id = def.id;
    this.sprite = def.sprite;
    this.x = def.tx * TILE_SIZE;
    this.y = def.ty * TILE_SIZE;
    this.dir = def.facing ?? 'down';
    this.label = def.label;
    this.patrol = def.patrol;
    this.lines = def.lines;
    this.flag = def.flag;
  }

  get sortY(): number {
    return this.y + 22;
  }

  hitbox(): Rect {
    return { x: this.x + 2, y: this.y + 16, w: 12, h: 8 };
  }

  interactBounds(): Rect {
    return { x: this.x, y: this.y + 8, w: 16, h: 18 };
  }

  interact(): void {
    bus.emit('dialog:open', { lines: this.lines, speaker: this.label });
    if (this.flag) bus.emit('quest:flag', { flag: this.flag });
  }

  update(dt: number, tilemap: Tilemap): void {
    this.animT += dt;
    if (!this.patrol || this.patrol.length === 0) return;
    this.waitT -= dt;
    if (this.waitT > 0) return;
    const target = this.patrol[this.patrolIdx];
    const tx = target.tx * TILE_SIZE;
    const ty = target.ty * TILE_SIZE;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1.5) {
      this.patrolIdx = (this.patrolIdx + 1) % this.patrol.length;
      this.waitT = 0.6 + Math.random() * 0.8;
      return;
    }
    const speed = 32;
    const step = (speed * dt) / dist;
    const nx = this.x + dx * step;
    const ny = this.y + dy * step;
    // tile collision (NPC stops at walls)
    const probe: Rect = { x: nx + 2, y: ny + 16, w: 12, h: 8 };
    if (!tilemap.collidesAABB(probe)) {
      this.x = nx;
      this.y = ny;
      // facing
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
      else this.dir = dy > 0 ? 'down' : 'up';
    } else {
      this.waitT = 0.8;
    }
  }

  draw(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; scale: number }): void {
    const sheet = getSprite(this.sprite);
    const dirCol: Record<Dir, number> = { down: 0, up: 1, right: 2, left: 3 };
    const moving = this.waitT <= 0 && this.patrol && this.patrol.length > 0;
    const row = moving && Math.floor(this.animT / 0.18) % 2 === 1 ? 1 : 0;
    const col = dirCol[this.dir];
    const dx = Math.round((this.x - cam.x) * cam.scale);
    const dy = Math.round((this.y - cam.y) * cam.scale);
    const dw = sheet.frame.w * cam.scale;
    const dh = sheet.frame.h * cam.scale;
    ctx.drawImage(sheet.canvas, col * sheet.frame.w, row * sheet.frame.h, sheet.frame.w, sheet.frame.h, dx, dy, dw, dh);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(dx + dw / 2, dy + dh - 2, dw * 0.35, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export interface SignDef {
  tx: number;
  ty: number;
  lines: string[];
}

export class Sign implements WorldRenderable, Interactable {
  readonly tx: number;
  readonly ty: number;
  private lines: string[];

  constructor(def: SignDef) {
    this.tx = def.tx;
    this.ty = def.ty;
    this.lines = def.lines;
  }

  get sortY(): number {
    return this.ty * TILE_SIZE + TILE_SIZE - 2;
  }

  interactBounds(): Rect {
    return { x: this.tx * TILE_SIZE, y: this.ty * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
  }

  interact(): void {
    bus.emit('dialog:open', { lines: this.lines });
  }

  /** The 'sign' tile is drawn by the tilemap; nothing extra to render. */
  draw(): void {}
}
