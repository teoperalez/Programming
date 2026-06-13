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

  draw(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; scale: number }, _time?: number): void {
    const sheet = getSprite(this.sprite);
    const dx = Math.round((this.tx * TILE_SIZE - cam.x) * cam.scale);
    const dy = Math.round((this.ty * TILE_SIZE - cam.y) * cam.scale);
    const w = sheet.frame.w * cam.scale;
    const h = sheet.frame.h * cam.scale;
    // soft ground shadow cast down-right, grounding the building
    ctx.save();
    const shY = dy + h - 3 * cam.scale;
    const grad = ctx.createLinearGradient(0, shY, 0, shY + 7 * cam.scale);
    grad.addColorStop(0, 'rgba(0,0,0,0.28)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(dx + w / 2 + 3 * cam.scale, shY + 2 * cam.scale, w * 0.52, 5 * cam.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(sheet.canvas, 0, 0, sheet.frame.w, sheet.frame.h, dx, dy, w, h);

    // sign text — pixel-perfect, centered on the painted sign band
    const signCenter = dx + (sheet.frame.w * cam.scale) / 2;
    const signY = dy + 18 * cam.scale;
    const pixelScale = Math.max(1, Math.floor(cam.scale * 0.5));
    const txt = this.label.toUpperCase();
    const tw = txt.length * 6 * pixelScale;
    // soft outline for legibility
    drawText(ctx, txt, signCenter - tw / 2 + 1, signY + 1, 'rgba(0,0,0,0.55)', pixelScale);
    drawText(ctx, txt, signCenter - tw / 2, signY, PAL.paper, pixelScale);
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
    let row = 0;
    if (moving) {
      const phase = Math.floor(this.animT / 0.12) % 4;
      row = phase === 0 ? 0 : phase === 1 ? 1 : phase === 2 ? 0 : 2;
    }
    const col = dirCol[this.dir];
    const dx = Math.round((this.x - cam.x) * cam.scale);
    const bob = moving ? (row === 0 ? 0 : 1) : 0;
    const dy = Math.round((this.y - cam.y) * cam.scale) + bob;
    const dw = sheet.frame.w * cam.scale;
    const dh = sheet.frame.h * cam.scale;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(dx + dw / 2, dy + dh - 1, dw * 0.34, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(sheet.canvas, col * sheet.frame.w, row * sheet.frame.h, sheet.frame.w, sheet.frame.h, dx, dy, dw, dh);
  }
}

/* ---------- Tree (walk-behind decoration) ---------- */

export class TreeEntity implements WorldRenderable {
  readonly tx: number;
  readonly ty: number;
  readonly sprite: 'tree-round' | 'tree-pine' | 'tree-squat';
  /** Phase offset so neighbouring trees don't all sway in sync. */
  private phase: number;

  constructor(tx: number, ty: number, sprite: 'tree-round' | 'tree-pine' | 'tree-squat' = 'tree-round') {
    this.tx = tx;
    this.ty = ty;
    this.sprite = sprite;
    this.phase = (tx * 13 + ty * 7) % 100;
  }

  /** sort by trunk base so player overlaps canopy correctly */
  get sortY(): number {
    // squat trees are single-tile; tall trees are 2 tiles with the trunk
    // anchored at ty+1, so sort by ty + 30 (matches trunk base).
    return this.ty * TILE_SIZE + (this.sprite === 'tree-squat' ? 14 : 30);
  }

  /** trunk-only collision box: bottom 4×8 px of the trunk tile */
  bounds(): import('./types').Rect {
    if (this.sprite === 'tree-squat') {
      return { x: this.tx * TILE_SIZE + 6, y: this.ty * TILE_SIZE + 8, w: 4, h: 6 };
    }
    return { x: this.tx * TILE_SIZE + 6, y: this.ty * TILE_SIZE + 22, w: 4, h: 8 };
  }

  draw(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; scale: number }, time?: number): void {
    const sheet = getSprite(this.sprite);
    const t = time ?? 0;
    // gentle horizontal sway
    const sway = Math.round(Math.sin((t + this.phase * 0.1) * 1.3) * 1);

    if (this.sprite === 'tree-squat') {
      // 16×16 single sprite: draw at ty, light sway applied whole-sprite.
      const dxBase = (this.tx * TILE_SIZE - cam.x) * cam.scale;
      const dyBase = (this.ty * TILE_SIZE - cam.y) * cam.scale;
      ctx.drawImage(
        sheet.canvas, 0, 0, 16, 16,
        Math.round(dxBase + sway * cam.scale * 0.18), Math.round(dyBase),
        16 * cam.scale, 16 * cam.scale,
      );
      return;
    }

    // 16×32: split into canopy (top 16) and trunk (bottom 16) so canopy sways
    const dxBase = (this.tx * TILE_SIZE - cam.x) * cam.scale;
    const dyBase = ((this.ty - 1) * TILE_SIZE - cam.y) * cam.scale;
    const halfH = 16;
    ctx.drawImage(
      sheet.canvas, 0, 0, 16, halfH,
      Math.round(dxBase + sway * cam.scale * 0.25), Math.round(dyBase),
      16 * cam.scale, halfH * cam.scale,
    );
    ctx.drawImage(
      sheet.canvas, 0, halfH, 16, 16,
      Math.round(dxBase), Math.round(dyBase + halfH * cam.scale),
      16 * cam.scale, 16 * cam.scale,
    );
  }
}

/* ---------- Fountain ---------- */

export class FountainEntity implements WorldRenderable {
  readonly tx: number;
  readonly ty: number;

  constructor(tx: number, ty: number) {
    this.tx = tx;
    this.ty = ty;
  }

  get sortY(): number { return this.ty * TILE_SIZE + 30; }

  /** Two-tile-wide solid base for collision (footprint is 32×32). */
  bounds(): import('./types').Rect {
    return { x: this.tx * TILE_SIZE + 4, y: this.ty * TILE_SIZE + 16, w: 24, h: 14 };
  }

  draw(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; scale: number }, time?: number): void {
    const sheet = getSprite('fountain');
    const frame = Math.floor(((time ?? 0) / 0.25)) % sheet.cols;
    const dx = Math.round((this.tx * TILE_SIZE - cam.x) * cam.scale);
    const dy = Math.round((this.ty * TILE_SIZE - cam.y) * cam.scale);
    ctx.drawImage(
      sheet.canvas,
      frame * sheet.frame.w, 0,
      sheet.frame.w, sheet.frame.h,
      dx, dy,
      sheet.frame.w * cam.scale, sheet.frame.h * cam.scale,
    );
  }
}

/* ---------- Antenna beacon (blinking light on GameHook roof) ---------- */

export class BeaconEntity implements WorldRenderable {
  readonly wx: number;
  readonly wy: number;
  /** seconds for one blink cycle */
  readonly period: number;

  constructor(wx: number, wy: number, period = 1.2) {
    this.wx = wx; this.wy = wy; this.period = period;
  }

  get sortY(): number { return this.wy; }

  draw(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; scale: number }, time?: number): void {
    const t = time ?? 0;
    const phase = (t % this.period) / this.period;
    const on = phase < 0.18;
    if (!on) return;
    const intensity = 1 - phase / 0.18;
    const dx = Math.round((this.wx - cam.x) * cam.scale);
    const dy = Math.round((this.wy - cam.y) * cam.scale);
    const r = 8 * cam.scale * (0.6 + intensity * 0.7);
    const grad = ctx.createRadialGradient(dx, dy, 0, dx, dy, r);
    grad.addColorStop(0, `rgba(255,60,37,${intensity})`);
    grad.addColorStop(0.4, `rgba(255,60,37,${intensity * 0.4})`);
    grad.addColorStop(1, 'rgba(255,60,37,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(dx - r, dy - r, r * 2, r * 2);
    // hard pixel center
    ctx.fillStyle = `rgba(255,${Math.round(60 + intensity * 200)},${Math.round(37 + intensity * 100)},1)`;
    ctx.fillRect(dx - cam.scale, dy - cam.scale, cam.scale * 2, cam.scale * 2);
  }
}

/* ---------- generic decorative prop (lamp, bush, flowerbed, …) ---------- */

export class Prop implements WorldRenderable {
  readonly sprite: string;
  /** world pixel position of the sprite's top-left. */
  readonly wx: number;
  readonly wy: number;
  /** optional warm light glow (lamp). radius in px, 0 = none. */
  readonly glow: number;
  /** sort offset added to the feet so e.g. a lamp sorts by its base. */
  private footY: number;
  private flickerSeed: number;

  constructor(sprite: string, tx: number, ty: number, opts?: { glow?: number; footYPx?: number; solid?: boolean }) {
    this.sprite = sprite;
    this.wx = tx * TILE_SIZE;
    this.wy = ty * TILE_SIZE;
    this.glow = opts?.glow ?? 0;
    this.footY = opts?.footYPx ?? 0;
    this.flickerSeed = (tx * 17 + ty * 31) % 1000;
  }

  get sortY(): number {
    const s = getSprite(this.sprite);
    return this.wy + (this.footY || s.frame.h - 2);
  }

  draw(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; scale: number }, time?: number): void {
    const s = getSprite(this.sprite);
    const dx = Math.round((this.wx - cam.x) * cam.scale);
    const dy = Math.round((this.wy - cam.y) * cam.scale);
    // glow first (under the post so the post draws crisp on top)
    if (this.glow > 0) {
      const t = time ?? 0;
      const flicker = 0.85 + 0.15 * Math.sin(t * 6 + this.flickerSeed);
      const gx = dx + 5 * cam.scale;
      const gy = dy + 5 * cam.scale;
      const rad = this.glow * cam.scale * flicker;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
      g.addColorStop(0, `rgba(255,200,90,${0.45 * flicker})`);
      g.addColorStop(0.5, `rgba(255,170,60,${0.18 * flicker})`);
      g.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
      ctx.restore();
    }
    ctx.drawImage(s.canvas, 0, 0, s.frame.w, s.frame.h, dx, dy, s.frame.w * cam.scale, s.frame.h * cam.scale);
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
  draw(_ctx: CanvasRenderingContext2D, _cam: { x: number; y: number; scale: number }, _time?: number): void {}
}
