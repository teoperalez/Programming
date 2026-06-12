/**
 * Smooth-follow camera with world bounds. Position is in world pixels (the
 * top-left visible point). Scale is the pixel-perfect zoom factor.
 */

import { TILE_SIZE } from './Assets';

export class Camera {
  x = 0;
  y = 0;
  /** target position the camera lerps toward. */
  tx = 0;
  ty = 0;
  scale = 3;
  /** viewport in CSS pixels (canvas internal already accounts for dpr). */
  vw = 800;
  vh = 600;
  /** world bounds in pixels. */
  worldW = 1024;
  worldH = 1024;

  /** Set the world bounds in tiles. */
  setWorld(tilesW: number, tilesH: number): void {
    this.worldW = tilesW * TILE_SIZE;
    this.worldH = tilesH * TILE_SIZE;
  }

  setViewport(vw: number, vh: number): void {
    this.vw = vw;
    this.vh = vh;
  }

  /** Center on a world point (player feet). */
  centerOn(wx: number, wy: number, instant = false): void {
    const half_w = this.vw / (2 * this.scale);
    const half_h = this.vh / (2 * this.scale);
    this.tx = Math.max(0, Math.min(this.worldW - this.vw / this.scale, wx - half_w));
    this.ty = Math.max(0, Math.min(this.worldH - this.vh / this.scale, wy - half_h));
    if (instant) {
      this.x = this.tx;
      this.y = this.ty;
    }
  }

  update(dt: number): void {
    // critically damped lerp
    const k = 1 - Math.exp(-dt * 9);
    this.x += (this.tx - this.x) * k;
    this.y += (this.ty - this.y) * k;
  }
}
