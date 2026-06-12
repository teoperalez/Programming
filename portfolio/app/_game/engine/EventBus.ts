/** Typed pub/sub bus for cross-system game events. */

export type GameEvents = {
  'world:ready': void;
  'world:enter-building': { id: string };
  'world:tile-step': { x: number; y: number };
  'player:moved': { x: number; y: number };
  'dialog:open': { lines: string[]; speaker?: string; onClose?: () => void };
  'dialog:advance': void;
  'dialog:closed': void;
  'panel:open': { id: string };
  'panel:closed': void;
  'battle:start': { id: string; defenderName: string };
  'battle:end': { id: string; won: boolean };
  'quest:flag': { flag: string };
  'audio:play': { sound: 'step' | 'select' | 'open' | 'close' | 'hit' | 'crit' | 'fanfare' };
  'console:log': { msg: string };
  'mode:read': void;
  'mode:game': void;
};

type Handler<E extends keyof GameEvents> = (payload: GameEvents[E]) => void;

class Bus {
  private handlers = new Map<keyof GameEvents, Set<(p: unknown) => void>>();

  on<E extends keyof GameEvents>(event: E, fn: Handler<E>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(fn as (p: unknown) => void);
    return () => set!.delete(fn as (p: unknown) => void);
  }

  emit<E extends keyof GameEvents>(event: E, payload: GameEvents[E]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const fn of set) {
      try {
        (fn as Handler<E>)(payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[event]', event, err);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const bus = new Bus();
