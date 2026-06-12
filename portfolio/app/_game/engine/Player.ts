/**
 * Player entity: smooth analog movement constrained by a tilemap. Animates
 * a 4-directional walk cycle. Y-sortable.
 */

import { TILE_SIZE, getSprite } from './Assets';
import type { Tilemap } from './Tilemap';
import type { Camera } from './Camera';
import type { Input } from './Input';
import type { Dir, Rect, WorldRenderable } from './types';
import { bus } from './EventBus';

const SPEED = 88; // px / s
const ANIM_PERIOD = 0.22;

export class Player implements WorldRenderable {
  x: number;
  y: number;
  dir: Dir = 'down';
  private animT = 0;
  private moving = false;
  private stepCool = 0;

  constructor(spawnX: number, spawnY: number) {
    this.x = spawnX;
    this.y = spawnY;
  }

  get sortY(): number {
    return this.y + 22;
  }

  /** Feet-only hitbox for tile collision: a 12×8 box anchored to the lower body. */
  hitbox(): Rect {
    return { x: this.x + 2, y: this.y + 16, w: 12, h: 8 };
  }

  /** Slightly larger interaction bounds (1 tile in facing direction). */
  facingProbe(): Rect {
    const h = this.hitbox();
    const cx = h.x + h.w / 2;
    const cy = h.y + h.h / 2;
    switch (this.dir) {
      case 'up':    return { x: cx - 4, y: cy - TILE_SIZE, w: 8, h: 8 };
      case 'down':  return { x: cx - 4, y: cy + TILE_SIZE - 8, w: 8, h: 8 };
      case 'left':  return { x: cx - TILE_SIZE, y: cy - 4, w: 8, h: 8 };
      case 'right': return { x: cx + TILE_SIZE - 8, y: cy - 4, w: 8, h: 8 };
    }
  }

  update(dt: number, input: Input, tilemap: Tilemap): void {
    const a = input.axis();
    let dx = 0, dy = 0;
    if (a.x !== 0 || a.y !== 0) {
      // 8-way at sqrt(2)/2 — preserves diagonal feel without diagonal sprites
      const inv = a.x !== 0 && a.y !== 0 ? Math.SQRT1_2 : 1;
      dx = a.x * SPEED * dt * inv;
      dy = a.y * SPEED * dt * inv;
      // facing prioritises last-pressed dominant axis
      if (Math.abs(a.x) > Math.abs(a.y)) this.dir = a.x > 0 ? 'right' : 'left';
      else this.dir = a.y > 0 ? 'down' : 'up';
      this.moving = true;
    } else {
      this.moving = false;
    }

    // X then Y, with tile collision per-axis (slide along walls)
    if (dx !== 0) {
      const next = this.hitbox();
      next.x += dx;
      if (!tilemap.collidesAABB(next)) this.x += dx;
    }
    if (dy !== 0) {
      const next = this.hitbox();
      next.y += dy;
      if (!tilemap.collidesAABB(next)) this.y += dy;
    }

    // animation
    if (this.moving) this.animT += dt;
    else this.animT = 0;

    // step sfx every other footfall
    this.stepCool -= dt;
    if (this.moving && this.stepCool <= 0) {
      this.stepCool = ANIM_PERIOD;
      bus.emit('audio:play', { sound: 'step' });
    }

    bus.emit('player:moved', { x: this.x, y: this.y });
  }

  draw(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; scale: number }): void {
    const sheet = getSprite('player');
    const dirCol: Record<Dir, number> = { down: 0, up: 1, right: 2, left: 3 };
    const row = this.moving && Math.floor(this.animT / (ANIM_PERIOD / 2)) % 2 === 1 ? 1 : 0;
    const col = dirCol[this.dir];
    const dx = Math.round((this.x - cam.x) * cam.scale);
    const dy = Math.round((this.y - cam.y) * cam.scale);
    const dw = sheet.frame.w * cam.scale;
    const dh = sheet.frame.h * cam.scale;
    ctx.drawImage(
      sheet.canvas,
      col * sheet.frame.w,
      row * sheet.frame.h,
      sheet.frame.w,
      sheet.frame.h,
      dx,
      dy,
      dw,
      dh,
    );
    // soft drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(dx + dw / 2, dy + dh - 2, dw * 0.35, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
