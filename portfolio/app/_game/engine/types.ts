/** Shared types for the game engine. */

export type Vec2 = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Dir = 'up' | 'down' | 'left' | 'right';

export interface GameMetrics {
  fps: number;
  frameMs: number;
  drawMs: number;
  entities: number;
  visibleTiles: number;
}

/** Anything renderable in the world space, sorted by y. */
export interface WorldRenderable {
  /** Anchor point used for y-sorting (usually the entity's feet). */
  sortY: number;
  draw(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; scale: number }, time?: number): void;
}

export interface Updatable {
  update(dt: number, time: number): void;
}

/** Marker interface for entities that participate in tile-aabb collision. */
export interface Solid {
  bounds(): Rect;
}

/** Marker interface for things the player can interact with. */
export interface Interactable {
  /** A small AABB the player must overlap (with facing) to trigger. */
  interactBounds(): Rect;
  /** Run when the player presses Space facing this thing. */
  interact(): void;
  /** Optional label drawn above the entity when player is nearby. */
  label?: string;
}
