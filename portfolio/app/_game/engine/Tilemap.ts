/**
 * Tilemap: layered tile grid with O(1) tile lookup. Solid bit on per-tile
 * basis for collision. Animated tiles resolve via tileSource(id, time).
 */

import { TILE_SIZE, tileSource, type TileID } from './Assets';
import type { Camera } from './Camera';
import type { Rect } from './types';

export interface TilemapDef {
  w: number;
  h: number;
  ground: TileID[];
  decor?: (TileID | null)[];
  solid: boolean[];
}

export class Tilemap {
  readonly w: number;
  readonly h: number;
  readonly ground: TileID[];
  readonly decor: (TileID | null)[];
  readonly solid: boolean[];

  constructor(def: TilemapDef) {
    this.w = def.w;
    this.h = def.h;
    this.ground = def.ground;
    this.decor = def.decor ?? new Array<TileID | null>(def.w * def.h).fill(null);
    this.solid = def.solid;
  }

  idx(x: number, y: number): number {
    return y * this.w + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  isSolidTile(tx: number, ty: number): boolean {
    if (!this.inBounds(tx, ty)) return true;
    return this.solid[this.idx(tx, ty)];
  }

  collidesAABB(r: Rect): boolean {
    const x0 = Math.floor(r.x / TILE_SIZE);
    const y0 = Math.floor(r.y / TILE_SIZE);
    const x1 = Math.floor((r.x + r.w - 1) / TILE_SIZE);
    const y1 = Math.floor((r.y + r.h - 1) / TILE_SIZE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (this.isSolidTile(tx, ty)) return true;
      }
    }
    return false;
  }

  /** Draw only the visible tiles, with time-keyed animation. Returns count. */
  draw(ctx: CanvasRenderingContext2D, cam: Camera, time: number): number {
    const scale = cam.scale;
    const x0 = Math.max(0, Math.floor(cam.x / TILE_SIZE));
    const y0 = Math.max(0, Math.floor(cam.y / TILE_SIZE));
    const x1 = Math.min(this.w - 1, Math.floor((cam.x + cam.vw / scale) / TILE_SIZE));
    const y1 = Math.min(this.h - 1, Math.floor((cam.y + cam.vh / scale) / TILE_SIZE));

    let drawn = 0;
    const dz = Math.round(TILE_SIZE * scale);

    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const i = this.idx(tx, ty);
        const id = this.ground[i];
        if (!id) continue;
        const src = tileSource(id, time);
        const dx = Math.round((tx * TILE_SIZE - cam.x) * scale);
        const dy = Math.round((ty * TILE_SIZE - cam.y) * scale);
        ctx.drawImage(src.atlas, src.sx, src.sy, src.sw, src.sh, dx, dy, dz, dz);
        drawn++;
        const d = this.decor[i];
        if (d) {
          const ds = tileSource(d, time);
          ctx.drawImage(ds.atlas, ds.sx, ds.sy, ds.sw, ds.sh, dx, dy, dz, dz);
          drawn++;
        }
      }
    }
    return drawn;
  }
}
