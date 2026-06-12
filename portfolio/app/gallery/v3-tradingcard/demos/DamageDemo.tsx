'use client';

import { useMemo, useState } from 'react';
import s from '../styles.module.css';
import { MONS, MOVES, calcDamage } from '@/lib/pokemon';

export default function DamageDemo() {
  const [atk, setAtk] = useState(MONS[0].name);
  const [def, setDef] = useState(MONS[1].name);
  const [mv, setMv] = useState(MOVES[0].name);
  const [stab, setStab] = useState(true);
  const [crit, setCrit] = useState(false);
  const [burn, setBurn] = useState(false);
  const [screen, setScreen] = useState(false);
  const [weather, setWeather] = useState(false);

  const result = useMemo(() => {
    const attacker = MONS.find((m) => m.name === atk)!;
    const defender = MONS.find((m) => m.name === def)!;
    const move = MOVES.find((m) => m.name === mv)!;
    return {
      attacker,
      defender,
      move,
      r: calcDamage(attacker, defender, move, { stab, crit, burn, screen, weather }),
    };
  }, [atk, def, mv, stab, crit, burn, screen, weather]);

  return (
    <>
      <label>Attacker</label>
      <select value={atk} onChange={(e) => setAtk(e.target.value)}>
        {MONS.map((m) => (
          <option key={m.name}>{m.name}</option>
        ))}
      </select>
      <label>Move</label>
      <select value={mv} onChange={(e) => setMv(e.target.value)}>
        {MOVES.map((m) => (
          <option key={m.name}>{m.name}</option>
        ))}
      </select>
      <label>Defender</label>
      <select value={def} onChange={(e) => setDef(e.target.value)}>
        {MONS.map((m) => (
          <option key={m.name}>{m.name}</option>
        ))}
      </select>
      <div className={s.checkrow}>
        <label>
          <input type="checkbox" checked={stab} onChange={(e) => setStab(e.target.checked)} />{' '}
          STAB
        </label>
        <label>
          <input type="checkbox" checked={crit} onChange={(e) => setCrit(e.target.checked)} /> Crit
        </label>
        <label>
          <input type="checkbox" checked={burn} onChange={(e) => setBurn(e.target.checked)} /> Burn
        </label>
        <label>
          <input
            type="checkbox"
            checked={screen}
            onChange={(e) => setScreen(e.target.checked)}
          />{' '}
          Screen
        </label>
        <label>
          <input
            type="checkbox"
            checked={weather}
            onChange={(e) => setWeather(e.target.checked)}
          />{' '}
          Weather
        </label>
      </div>
      <div className={s.out}>
        ATK ▸ {result.attacker.atk} / SPA {result.attacker.spa}
        <br />
        DEF ▸ HP {result.defender.hp}
        <br />
        MOVE ▸ {result.move.power} BP · {result.move.type}
        <br />
        EFF ▸ ×{result.r.effect}
        <br />
        DMG ▸ {result.r.lo}–{result.r.hi} ({result.r.pctHi}%)
        <br />
        RESULT ▸ {result.r.verdict}
      </div>
      <div className={s.bar}>
        <div style={{ width: `${result.r.pctHi}%` }} />
      </div>
    </>
  );
}
