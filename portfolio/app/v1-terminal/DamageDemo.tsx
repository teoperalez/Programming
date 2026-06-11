'use client';

import { useState } from 'react';
import { MONS, MOVES, calcDamage, type CalcOptions } from '@/lib/pokemon';
import styles from './styles.module.css';

const DEFAULT_OPTS: CalcOptions = {
  stab: true,
  crit: false,
  burn: false,
  screen: false,
  weather: false,
};

const TOGGLES: Array<{ key: keyof CalcOptions; label: string }> = [
  { key: 'stab', label: 'STAB' },
  { key: 'crit', label: 'crit' },
  { key: 'burn', label: 'burn' },
  { key: 'screen', label: 'screen' },
  { key: 'weather', label: 'weather' },
];

function Selector({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.selRow}>
      <span className={styles.selLabel}>{label}</span>
      <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.toLowerCase()}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function DamageDemo() {
  const [atk, setAtk] = useState('Gengar');
  const [def, setDef] = useState('Venusaur');
  const [mv, setMv] = useState('Thunderbolt');
  const [opts, setOpts] = useState<CalcOptions>(DEFAULT_OPTS);

  const attacker = MONS.find((m) => m.name === atk) ?? MONS[0];
  const defender = MONS.find((m) => m.name === def) ?? MONS[1];
  const move = MOVES.find((m) => m.name === mv) ?? MOVES[0];

  const r = calcDamage(attacker, defender, move, opts);
  const filled = Math.round(r.pctHi / 3);
  const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, 33 - filled));

  return (
    <div>
      <Selector label="attacker" value={attacker.name} options={MONS.map((m) => m.name)} onChange={setAtk} />
      <Selector label="defender" value={defender.name} options={MONS.map((m) => m.name)} onChange={setDef} />
      <Selector label="move" value={move.name} options={MOVES.map((m) => m.name)} onChange={setMv} />

      <div className={styles.toggles}>
        {TOGGLES.map(({ key, label }) => (
          <label key={key} className={styles.toggle}>
            <input
              type="checkbox"
              checked={opts[key]}
              onChange={(e) => setOpts((o) => ({ ...o, [key]: e.target.checked }))}
            />
            {label}
          </label>
        ))}
      </div>

      <pre className={styles.demoOut}>
        {`> ${attacker.name.toLowerCase()} uses ${move.name.toLowerCase()} on ${defender.name.toLowerCase()}\n`}
        {`  type effectiveness: x${r.effect}   `}
        {r.effect === 0 ? (
          <span className={styles.fxRed}>NO EFFECT</span>
        ) : r.effect >= 2 ? (
          <span className={styles.fxGreen}>SUPER EFFECTIVE</span>
        ) : r.effect < 1 ? (
          <span className={styles.fxMute}>not very effective</span>
        ) : null}
        {`\n  damage range      : ${r.lo}–${r.hi} (${r.pctLo}%–${r.pctHi}% of ${defender.hp} HP)\n`}
        {'  result            : '}
        <span className={styles.fxFg}>{r.verdict}</span>
        {`\n\n  ${bar}  ${r.pctHi}%`}
      </pre>
    </div>
  );
}
