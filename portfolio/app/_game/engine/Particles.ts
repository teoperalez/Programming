/**
 * Lightweight particle system. World-space coordinates, lives one update
 * per spawned particle, paints with the camera transform. Cheap.
 */

import type { Camera } from './Camera';
import { bus } from './EventBus';
import { PAL } from './Assets';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  life: number;
  age: number;
  color: string;
  size: number;
  shrink: number;
  /** sort anchor in world-y (for layering). */
  z: number;
}

export class Particles {
  private list: Particle[] = [];
  private unsubs: Array<() => void> = [];

  attach(): void {
    this.unsubs.push(bus.on('fx:dust', ({ x, y, dir }) => {
      // small dust puff opposite the direction of travel
      const back = { up: { x: 0, y: 1 }, down: { x: 0, y: -1 }, left: { x: 1, y: 0 }, right: { x: -1, y: 0 } }[dir];
      for (let i = 0; i < 3; i++) {
        this.list.push({
          x: x + (Math.random() - 0.5) * 4,
          y: y + (Math.random() - 0.5) * 2,
          vx: back.x * 4 + (Math.random() - 0.5) * 8,
          vy: back.y * 4 - 6 - Math.random() * 4,
          ax: 0, ay: 18,
          life: 0.35, age: 0,
          color: PAL.bone,
          size: 1.4, shrink: 1.4 / 0.35,
          z: y,
        });
      }
    }));

    this.unsubs.push(bus.on('fx:leaf', ({ x, y }) => {
      this.list.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: -2 - Math.random() * 4,
        ax: Math.sin(Math.random() * Math.PI) * 3, ay: 6,
        life: 3 + Math.random() * 2, age: 0,
        color: Math.random() > 0.5 ? PAL.grassDim : PAL.gold,
        size: 1.2, shrink: 0,
        z: y,
      });
    }));

    this.unsubs.push(bus.on('fx:smoke', ({ x, y }) => {
      for (let i = 0; i < 2; i++) {
        this.list.push({
          x: x + (Math.random() - 0.5) * 2,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: -8 - Math.random() * 6,
          ax: 0, ay: -2,
          life: 1.6, age: 0,
          color: 'rgba(180,170,160,0.6)',
          size: 2 + Math.random(), shrink: -1.5,
          z: y,
        });
      }
    }));
  }

  detach(): void {
    for (const u of this.unsubs) u();
    this.unsubs = [];
    this.list = [];
  }

  update(dt: number): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.list.splice(i, 1);
        continue;
      }
      p.vx += p.ax * dt;
      p.vy += p.ay * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  /** Draw between buildings/entities? No — call after world for now. */
  draw(ctx: CanvasRenderingContext2D, cam: Camera): void {
    for (const p of this.list) {
      const alpha = 1 - p.age / p.life;
      const sz = Math.max(1, p.size - p.shrink * p.age);
      const dx = Math.round((p.x - cam.x) * cam.scale);
      const dy = Math.round((p.y - cam.y) * cam.scale);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;
      ctx.fillRect(dx, dy, sz * cam.scale, sz * cam.scale);
      ctx.restore();
    }
  }

  count(): number { return this.list.length; }
}
