'use client';

import { useState } from 'react';
import s from '../styles.module.css';
import { MONS, MOVES, calcDamage, type CalcOptions } from '@/lib/pokemon';

const TOGGLES: ReadonlyArray<readonly [keyof CalcOptions, string]> = [
  ['stab', 'STAB'],
  ['crit', 'Crit'],
  ['burn', 'Burn'],
  ['screen', 'Screen'],
  ['weather', 'Weather'],
];

export default function DamageLab() {
  const [atk, setAtk] = useState(0);
  const [mv, setMv] = useState(0);
  const [def, setDef] = useState(1);
  const [opts, setOpts] = useState<CalcOptions>({
    stab: true,
    crit: false,
    burn: false,
    screen: false,
    weather: false,
  });

  const attacker = MONS[atk];
  const defender = MONS[def];
  const move = MOVES[mv];
  const r = calcDamage(attacker, defender, move, opts);

  const effText =
    r.effect === 0
      ? 'no effect'
      : r.effect === 1
        ? 'neutral'
        : r.effect > 1
          ? `super-effective ×${r.effect}`
          : `resisted ×${r.effect}`;

  return (
    <div>
      <div className={s.labNote}>From GSCNewLayout · the real Gen 2 formula</div>

      <label className={s.labLabel} htmlFor="lab-atk">
        Attacker
      </label>
      <select id="lab-atk" className={s.select} value={atk} onChange={(e) => setAtk(Number(e.target.value))}>
        {MONS.map((m, i) => (
          <option key={m.name} value={i}>
            {m.name}
          </option>
        ))}
      </select>

      <label className={s.labLabel} htmlFor="lab-mv">
        Move
      </label>
      <select id="lab-mv" className={s.select} value={mv} onChange={(e) => setMv(Number(e.target.value))}>
        {MOVES.map((m, i) => (
          <option key={m.name} value={i}>
            {m.name} · {m.type} {m.cat === 'sp' ? '(sp)' : '(ph)'}
          </option>
        ))}
      </select>

      <label className={s.labLabel} htmlFor="lab-def">
        Defender
      </label>
      <select id="lab-def" className={s.select} value={def} onChange={(e) => setDef(Number(e.target.value))}>
        {MONS.map((m, i) => (
          <option key={m.name} value={i}>
            {m.name} · {m.hp} HP
          </option>
        ))}
      </select>

      <div className={s.checkrow}>
        {TOGGLES.map(([key, label]) => (
          <label key={key} className={s.checkLabel}>
            <input
              type="checkbox"
              checked={opts[key]}
              onChange={(e) => setOpts((o) => ({ ...o, [key]: e.target.checked }))}
            />
            {label}
          </label>
        ))}
      </div>

      <div className={s.labResult}>
        <div className={s.num}>
          {r.effect === 0 ? '0' : `${r.lo}–${r.hi}`} <span className={s.pct}>· {r.pctHi}% HP</span>
        </div>
        <div className={s.verdict}>
          {r.verdict} @ {effText}
          {Number.isFinite(r.hitsToKO) ? ` · ${r.hitsToKO} hit${r.hitsToKO === 1 ? '' : 's'} @ max roll` : ''}
        </div>
        <div className={s.labBar}>
          <div className={s.labFill} style={{ width: `${r.pctHi}%` }} />
        </div>
      </div>

      <div className={s.formula}>d = (((2·L/5+2) · P · A/D) / 50 + 2) · stab · type · crit · burn · screen · weather</div>
    </div>
  );
}
