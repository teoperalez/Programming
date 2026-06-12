/**
 * Keyboard + gamepad input with edge detection.
 *
 * - `held(key)`   — is the action currently held?
 * - `pressed(key)`— was it pressed this frame (edge)?
 * - `released(key)`
 *
 * Edge state is computed once per `flip()` (called from the game loop's
 * fixed-step update phase, AFTER systems have consumed it).
 */

export type GameKey =
  | 'up' | 'down' | 'left' | 'right'
  | 'confirm' | 'cancel' | 'menu' | 'console' | 'mode';

const KEY_MAP: Record<string, GameKey> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'confirm', Enter: 'confirm', KeyZ: 'confirm',
  Escape: 'cancel', KeyX: 'cancel',
  KeyM: 'menu',
  Backquote: 'console',
  Tab: 'mode',
};

export class Input {
  private cur = new Set<GameKey>();
  private prev = new Set<GameKey>();
  private cleanups: Array<() => void> = [];

  attach(target: EventTarget = window): void {
    const down = (e: Event) => {
      const ke = e as KeyboardEvent;
      const k = KEY_MAP[ke.code];
      if (!k) return;
      // prevent arrow-key page scroll, tab focus jump, backtick console
      if (k !== 'console') ke.preventDefault();
      this.cur.add(k);
    };
    const up = (e: Event) => {
      const ke = e as KeyboardEvent;
      const k = KEY_MAP[ke.code];
      if (!k) return;
      this.cur.delete(k);
    };
    const blur = () => this.cur.clear();

    target.addEventListener('keydown', down as EventListener);
    target.addEventListener('keyup', up as EventListener);
    window.addEventListener('blur', blur);

    this.cleanups.push(() => {
      target.removeEventListener('keydown', down as EventListener);
      target.removeEventListener('keyup', up as EventListener);
      window.removeEventListener('blur', blur);
    });
  }

  detach(): void {
    for (const c of this.cleanups) c();
    this.cleanups = [];
    this.cur.clear();
    this.prev.clear();
  }

  /** Inject a virtual press (for on-screen mobile d-pad). */
  virtualPress(k: GameKey): void {
    this.cur.add(k);
  }
  virtualRelease(k: GameKey): void {
    this.cur.delete(k);
  }

  held(k: GameKey): boolean {
    return this.cur.has(k);
  }

  pressed(k: GameKey): boolean {
    return this.cur.has(k) && !this.prev.has(k);
  }

  released(k: GameKey): boolean {
    return !this.cur.has(k) && this.prev.has(k);
  }

  /** Compute axis-style input for movement. */
  axis(): { x: -1 | 0 | 1; y: -1 | 0 | 1 } {
    const x = this.held('left') ? -1 : this.held('right') ? 1 : 0;
    const y = this.held('up') ? -1 : this.held('down') ? 1 : 0;
    return { x: x as -1 | 0 | 1, y: y as -1 | 0 | 1 };
  }

  /** Called at end of each frame to roll edge state. */
  flip(): void {
    this.prev = new Set(this.cur);
  }
}
