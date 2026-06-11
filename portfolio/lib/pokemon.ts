/**
 * Shared Gen 2-style damage calculation used by the interactive demos.
 * Simplified from the real GSCNewLayout calculator: the real one also handles
 * held items, badge boosts, semi-invulnerable double damage, and Hidden
 * Power / Return / Frustration variable base power.
 */

export interface Mon {
  name: string;
  atk: number;
  spa: number;
  hp: number;
  types: string[];
}

export interface Move {
  name: string;
  power: number;
  type: string;
  cat: 'ph' | 'sp';
}

export const MONS: Mon[] = [
  { name: 'Gengar', atk: 165, spa: 244, hp: 261, types: ['Ghost', 'Poison'] },
  { name: 'Venusaur', atk: 189, spa: 222, hp: 364, types: ['Grass', 'Poison'] },
  { name: 'Snorlax', atk: 350, spa: 200, hp: 523, types: ['Normal'] },
  { name: 'Alakazam', atk: 154, spa: 295, hp: 261, types: ['Psychic'] },
  { name: 'Machamp', atk: 343, spa: 167, hp: 343, types: ['Fighting'] },
  { name: 'Starmie', atk: 178, spa: 247, hp: 261, types: ['Water', 'Psychic'] },
  { name: 'Chansey', atk: 89, spa: 222, hp: 703, types: ['Normal'] },
  { name: 'Rhydon', atk: 358, spa: 125, hp: 413, types: ['Ground', 'Rock'] },
];

export const MOVES: Move[] = [
  { name: 'Thunderbolt', power: 95, type: 'Electric', cat: 'sp' },
  { name: 'Earthquake', power: 100, type: 'Ground', cat: 'ph' },
  { name: 'Psychic', power: 90, type: 'Psychic', cat: 'sp' },
  { name: 'Body Slam', power: 85, type: 'Normal', cat: 'ph' },
  { name: 'Surf', power: 95, type: 'Water', cat: 'sp' },
  { name: 'Ice Beam', power: 95, type: 'Ice', cat: 'sp' },
  { name: 'Shadow Ball', power: 80, type: 'Ghost', cat: 'ph' },
  { name: 'Cross Chop', power: 100, type: 'Fighting', cat: 'ph' },
];

/** Type effectiveness from the attacker's move type vs defender types. */
const CHART: Record<string, Record<string, number>> = {
  Electric: { Water: 2, Flying: 2, Ground: 0, Electric: 0.5, Grass: 0.5, Dragon: 0.5 },
  Ground: { Fire: 2, Electric: 2, Poison: 2, Rock: 2, Steel: 2, Flying: 0, Grass: 0.5, Bug: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Normal: { Ghost: 0, Rock: 0.5, Steel: 0.5 },
  Water: { Fire: 2, Ground: 2, Rock: 2, Water: 0.5, Grass: 0.5, Dragon: 0.5 },
  Ice: { Grass: 2, Ground: 2, Flying: 2, Dragon: 2, Water: 0.5, Fire: 0.5, Ice: 0.5, Steel: 0.5 },
  Ghost: { Psychic: 2, Ghost: 2, Normal: 0, Dark: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Rock: 2, Dark: 2, Steel: 2, Ghost: 0, Flying: 0.5, Poison: 0.5, Psychic: 0.5, Bug: 0.5 },
  Grass: { Water: 2, Ground: 2, Rock: 2, Fire: 0.5, Grass: 0.5, Poison: 0.5, Flying: 0.5, Bug: 0.5, Dragon: 0.5, Steel: 0.5 },
};

export function typeEffect(moveType: string, defenderTypes: string[]): number {
  const row = CHART[moveType] ?? {};
  return defenderTypes.reduce((m, t) => m * (row[t] ?? 1), 1);
}

export interface CalcOptions {
  stab: boolean;
  crit: boolean;
  burn: boolean;
  screen: boolean;
  weather: boolean;
}

export interface CalcResult {
  lo: number;
  hi: number;
  effect: number;
  pctLo: number;
  pctHi: number;
  /** hits to KO at max roll; Infinity when the move can't connect */
  hitsToKO: number;
  verdict: string;
}

export function calcDamage(attacker: Mon, defender: Mon, move: Move, opts: CalcOptions): CalcResult {
  const level = 100;
  const A = move.cat === 'sp' ? attacker.spa : attacker.atk;
  const D = move.cat === 'sp' ? defender.spa : defender.atk;
  let dmg = (((2 * level) / 5 + 2) * move.power * (A / D)) / 50 + 2;

  if (opts.stab && attacker.types.includes(move.type)) dmg *= 1.5;
  const effect = typeEffect(move.type, defender.types);
  dmg *= effect;
  if (opts.crit) dmg *= 2;
  if (opts.burn && move.cat === 'ph') dmg *= 0.5;
  if (opts.screen) dmg *= 0.5;
  if (opts.weather) dmg *= 1.5;

  const lo = Math.floor(dmg * 0.85);
  const hi = Math.floor(dmg);
  const pctLo = Math.min(100, Math.round((lo / defender.hp) * 100));
  const pctHi = Math.min(100, Math.round((hi / defender.hp) * 100));
  const hitsToKO = effect === 0 || hi <= 0 ? Infinity : Math.ceil(defender.hp / hi);

  let verdict: string;
  if (effect === 0) verdict = 'no effect';
  else if (lo >= defender.hp) verdict = 'guaranteed 1-shot';
  else if (hi >= defender.hp) verdict = 'roll for the KO';
  else verdict = `${hitsToKO}-hit KO`;

  return { lo, hi, effect, pctLo, pctHi, hitsToKO, verdict };
}
