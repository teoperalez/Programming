/**
 * Player entity: smooth analog movement constrained by a tilemap. Animates
 * a 4-directional 3-frame walk cycle. Y-sortable. Emits footstep dust.
 */

import { TILE_SIZE, getSprite } from './Assets';
import type { Tilemap } from './Tilemap';
import type { Input } from './Input';
import type { Dir, Rect, WorldRenderable } from './types';
import { bus } from './EventBus';

const SPEED = 92;
const ANIM_PERIOD = 0.20;

export class Player implements WorldRenderable {
  x: number;
  y: number;
  dir: Dir = 'down';
  private animT = 0;
  private moving = false;
  private stepCool = 0;
  private bobT = 0;

  constructor(spawnX: number, spawnY: number) {
    this.x = spawnX;
    this.y = spawnY;
  }

  get sortY(): number { return this.y + 22; }

  hitbox(): Rect { return { x: this.x + 2, y: this.y + 16, w: 12, h: 8 }; }

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
      const inv = a.x !== 0 && a.y !== 0 ? Math.SQRT1_2 : 1;
      dx = a.x * SPEED * dt * inv;
      dy = a.y * SPEED * dt * inv;
      if (Math.abs(a.x) > Math.abs(a.y)) this.dir = a.x > 0 ? 'right' : 'left';
      else this.dir = a.y > 0 ? 'down' : 'up';
      this.moving = true;
    } else {
      this.moving = false;
    }

    if (dx !== 0) {
      const n = this.hitbox(); n.x += dx;
      if (!tilemap.collidesAABB(n)) this.x += dx;
    }
    if (dy !== 0) {
      const n = this.hitbox(); n.y += dy;
      if (!tilemap.collidesAABB(n)) this.y += dy;
    }

    if (this.moving) {
      this.animT += dt;
      this.bobT += dt;
    } else {
      this.animT = 0;
      // gentle idle breathing
      this.bobT += dt * 0.4;
    }

    this.stepCool -= dt;
    if (this.moving && this.stepCool <= 0) {
      this.stepCool = ANIM_PERIOD;
      bus.emit('audio:play', { sound: 'step' });
      // emit a footstep-dust particle anchored to feet
      bus.emit('fx:dust', { x: this.x + 8, y: this.y + 22, dir: this.dir });
    }

    bus.emit('player:moved', { x: this.x, y: this.y });
  }

  draw(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; scale: number }): void {
    const sheet = getSprite('player');
    // sprite columns: down=0, up=1, right=2, left=3
    // sprite rows:    idle=0, stepA=1, stepB=2
    const dirCol: Record<Dir, number> = { down: 0, up: 1, right: 2, left: 3 };
    const col = dirCol[this.dir];
    let row = 0;
    if (this.moving) {
      const phase = Math.floor(this.animT / (ANIM_PERIOD / 2)) % 4;
      row = phase === 0 ? 0 : phase === 1 ? 1 : phase === 2 ? 0 : 2;
    }
    const dx = Math.round((this.x - cam.x) * cam.scale);
    // head-bob offset: 1px down on midstep
    const bob = this.moving ? (row === 0 ? 0 : 1) : Math.round(Math.sin(this.bobT * 3.4) * 0.4);
    const dy = Math.round((this.y - cam.y) * cam.scale) + bob;
    const dw = sheet.frame.w * cam.scale;
    const dh = sheet.frame.h * cam.scale;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(dx + dw / 2, dy + dh - 1, dw * 0.34, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(
      sheet.canvas,
      col * sheet.frame.w, row * sheet.frame.h,
      sheet.frame.w, sheet.frame.h,
      dx, dy, dw, dh,
    );
  }
}
