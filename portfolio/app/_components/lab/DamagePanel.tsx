'use client';

import { useMemo, useState } from 'react';
import s from './Lab.module.css';
import { MONS, MOVES, calcDamage } from '@/lib/pokemon';

export default function DamagePanel() {
  const [atk, setAtk] = useState('Gengar');
  const [mv, setMv] = useState('Thunderbolt');
  const [def, setDef] = useState('Venusaur');
  const [stab, setStab] = useState(true);
  const [crit, setCrit] = useState(false);
  const [burn, setBurn] = useState(false);
  const [screen, setScreen] = useState(false);
  const [weather, setWeather] = useState(false);

  const result = useMemo(() => {
    const a = MONS.find((m) => m.name === atk)!;
    const d = MONS.find((m) => m.name === def)!;
    const m = MOVES.find((mm) => mm.name === mv)!;
    return { a, d, m, r: calcDamage(a, d, m, { stab, crit, burn, screen, weather }) };
  }, [atk, mv, def, stab, crit, burn, screen, weather]);

  return (
    <article className={s.panel}>
      <div className={s.panelHead}>
        <h3 className={s.panelTitle}>damage lab</h3>
        <span className={s.panelMeta}>gen 2 · live formula</span>
      </div>
      <p className={s.panelDesc}>
        The same calculator the runner sees mid-battle in GSCNewLayout. Pick a matchup; the
        verdict updates frame-by-frame.
      </p>

      <div className={s.panelBody}>
        <div className={s.dmgSelects}>
          <div>
            <label>attacker</label>
            <select value={atk} onChange={(e) => setAtk(e.target.value)}>
              {MONS.map((m) => (<option key={m.name}>{m.name}</option>))}
            </select>
          </div>
          <div>
            <label>move</label>
            <select value={mv} onChange={(e) => setMv(e.target.value)}>
              {MOVES.map((m) => (<option key={m.name}>{m.name}</option>))}
            </select>
          </div>
          <div>
            <label>defender</label>
            <select value={def} onChange={(e) => setDef(e.target.value)}>
              {MONS.map((m) => (<option key={m.name}>{m.name}</option>))}
            </select>
          </div>
        </div>

        <div className={s.toggles}>
          {[
            ['STAB', stab, setStab],
            ['crit', crit, setCrit],
            ['burn', burn, setBurn],
            ['screen', screen, setScreen],
            ['weather', weather, setWeather],
          ].map(([label, v, set]) => (
            <button
              key={label as string}
              className={`${s.toggle} ${v ? s.on : ''}`}
              onClick={() => (set as (b: boolean) => void)(!(v as boolean))}
            >
              {label as string}
            </button>
          ))}
        </div>

        <div className={s.dmgResult}>
          <div className={s.dmgNum}>
            {result.r.lo}–{result.r.hi}
          </div>
          <div className={s.dmgVerdict}>
            {result.r.verdict}
            <span className={s.pct}>
              {result.r.pctHi}% of {result.d.hp} hp · ×{result.r.effect}
            </span>
          </div>
          <div className={s.dmgBar}>
            <div style={{ width: `${result.r.pctHi}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}
