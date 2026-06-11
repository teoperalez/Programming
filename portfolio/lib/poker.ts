/**
 * Shared poker hand evaluation + Monte-Carlo equity used by the demos.
 * Browser-sized cousin of the PokerSolver evaluator.
 */

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
export const SUITS = ['s', 'h', 'd', 'c'] as const;

export type Card = string; // e.g. "As", "Td"

export function makeDeck(): Card[] {
  const d: Card[] = [];
  for (const r of RANKS) for (const s of SUITS) d.push(r + s);
  return d;
}

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const rval = (r: string) => RANKS.indexOf(r as (typeof RANKS)[number]);

/** Score a 5-card hand. Higher is better. Category * 1e10 + kicker weights. */
export function eval5(cards: Card[]): number {
  const rs = cards.map((c) => rval(c[0])).sort((a, b) => b - a);
  const suits = cards.map((c) => c[1]);
  const flush = suits.every((s) => s === suits[0]);
  const uniq = [...new Set(rs)];
  let straight = uniq.length === 5 && rs[0] - rs[4] === 4;
  // wheel (A-2-3-4-5)
  if (!straight && uniq.length === 5 && rs[0] === 12 && rs[1] === 3) {
    straight = true;
    rs.push(rs.shift()!);
    rs[4] = -1;
  }
  const counts: Record<number, number> = {};
  rs.forEach((r) => (counts[r] = (counts[r] ?? 0) + 1));
  const groups = Object.entries(counts)
    .map(([r, n]) => [Number(r), n] as [number, number])
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  let cat: number;
  if (straight && flush) cat = 8;
  else if (groups[0][1] === 4) cat = 7;
  else if (groups[0][1] === 3 && groups[1][1] === 2) cat = 6;
  else if (flush) cat = 5;
  else if (straight) cat = 4;
  else if (groups[0][1] === 3) cat = 3;
  else if (groups[0][1] === 2 && groups[1][1] === 2) cat = 2;
  else if (groups[0][1] === 2) cat = 1;
  else cat = 0;

  let score = cat * 1e10;
  groups.forEach((g, i) => {
    score += g[0] * Math.pow(13, 4 - i);
  });
  return score;
}

/** Best 5-card score from 7 cards. */
export function eval7(cards: Card[]): number {
  let best = -1;
  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      const five = cards.filter((_, k) => k !== i && k !== j);
      const v = eval5(five);
      if (v > best) best = v;
    }
  }
  return best;
}

export interface EquityState {
  iters: number;
  w1: number;
  w2: number;
  tie: number;
}

export function emptyEquity(): EquityState {
  return { iters: 0, w1: 0, w2: 0, tie: 0 };
}

/** Run one batch of Monte-Carlo boards; mutates and returns state. */
export function runBatch(h1: Card[], h2: Card[], state: EquityState, batch = 500): EquityState {
  const base = makeDeck().filter((c) => !h1.includes(c) && !h2.includes(c));
  for (let i = 0; i < batch; i++) {
    const d = shuffle([...base]);
    const board = d.slice(0, 5);
    const v1 = eval7([...h1, ...board]);
    const v2 = eval7([...h2, ...board]);
    if (v1 > v2) state.w1++;
    else if (v2 > v1) state.w2++;
    else state.tie++;
    state.iters++;
  }
  return state;
}

export function equityPct(state: EquityState, side: 1 | 2): number {
  const total = state.iters || 1;
  const wins = side === 1 ? state.w1 : state.w2;
  return ((wins + state.tie / 2) / total) * 100;
}
