/** Minimal localStorage save: player position + visited flags. */

const KEY = 'teoperalez.portfolio.save.v1';

export interface SaveState {
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  flags: string[];
  /** Last 4 chars of an ISO timestamp, for "last seen" UI. */
  ts: number;
  visited: string[];
}

export function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveState;
  } catch {
    return null;
  }
}

export function writeSave(s: SaveState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore quota
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
