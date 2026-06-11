'use client';

import { useState, type ReactNode } from 'react';
import { MONS, MOVES, calcDamage, type CalcOptions } from '@/lib/pokemon';
import styles from './styles.module.css';

const TOGGLES: { key: keyof CalcOptions; label: string }[] = [
  { key: 'stab', label: 'STAB' },
  { key: 'crit', label: 'critical hit' },
  { key: 'burn', label: 'attacker burned' },
  { key: 'screen', label: 'defender screened' },
  { key: 'weather', label: 'weather boost' },
];

function fmtEffect(effect: number): string {
  return `×${effect}`;
}

/**
 * Specimen 01 — the GSCNewLayout damage calculator rendered as a magazine
 * infographic. All math comes from the shared @/lib/pokemon calcDamage.
 */
export default function Specimen() {
  const [atkIdx, setAtkIdx] = useState(0); // Gengar
  const [mvIdx, setMvIdx] = useState(0); // Thunderbolt
  const [defIdx, setDefIdx] = useState(1); // Venusaur
  const [opts, setOpts] = useState<CalcOptions>({
    stab: true,
    crit: false,
    burn: false,
    screen: false,
    weather: false,
  });

  const attacker = MONS[atkIdx];
  const defender = MONS[defIdx];
  const move = MOVES[mvIdx];
  const r = calcDamage(attacker, defender, move, opts);

  let headline: ReactNode;
  if (r.effect === 0) {
    headline = (
      <>
        No <em>effect</em> at all.
      </>
    );
  } else if (r.verdict === 'guaranteed 1-shot') {
    headline = (
      <>
        A clean <em>one-shot</em>.
      </>
    );
  } else if (r.verdict === 'roll for the KO') {
    headline = (
      <>
        Roll for the <em>one-shot</em>.
      </>
    );
  } else if (r.hitsToKO === 2) {
    headline = (
      <>
        A clean <em>two-shot</em>.
      </>
    );
  } else if (r.hitsToKO === 3) {
    headline = (
      <>
        A patient <em>three-hit</em>.
      </>
    );
  } else if (r.effect >= 2) {
    headline = (
      <>
        <em>Super-effective</em> {fmtEffect(r.effect)}.
      </>
    );
  } else {
    headline = (
      <>
        <em>{r.hitsToKO} hits</em> at this matchup.
      </>
    );
  }

  const matchup =
    r.effect === 0
      ? 'Move does not connect.'
      : r.effect >= 2
        ? `Super-effective ${fmtEffect(r.effect)}.`
        : r.effect < 1
          ? `Resisted ${fmtEffect(r.effect)}.`
          : 'Neutral matchup.';

  return (
    <section className={styles.specimen} id="specimen">
      <h3>The damage calculator, in editorial form.</h3>
      <p className={styles.specLede}>
        The Gen 2 formula from <em>GSCNewLayout</em>, rendered as a magazine infographic. Adjust the
        three columns — attacker, move, defender — and watch the headline rewrite itself.
      </p>

      <div className={styles.specGrid}>
        <div className={styles.specCol}>
          <label htmlFor="spec-atk">Attacker</label>
          <select id="spec-atk" value={atkIdx} onChange={(e) => setAtkIdx(Number(e.target.value))}>
            {MONS.map((m, i) => (
              <option key={m.name} value={i}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.specCol}>
          <label htmlFor="spec-mv">Move</label>
          <select id="spec-mv" value={mvIdx} onChange={(e) => setMvIdx(Number(e.target.value))}>
            {MOVES.map((m, i) => (
              <option key={m.name} value={i}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.specCol}>
          <label htmlFor="spec-def">Defender</label>
          <select id="spec-def" value={defIdx} onChange={(e) => setDefIdx(Number(e.target.value))}>
            {MONS.map((m, i) => (
              <option key={m.name} value={i}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.specToggles}>
        {TOGGLES.map((t) => (
          <label key={t.key} className={styles.specToggle}>
            <input
              type="checkbox"
              checked={opts[t.key]}
              onChange={(e) => setOpts((o) => ({ ...o, [t.key]: e.target.checked }))}
            />
            {t.label}
          </label>
        ))}
      </div>

      <div className={styles.specResult}>
        <div>
          <p className={`${styles.byline} ${styles.specByline}`}>By the formula</p>
          <h2 className={styles.specHeadline}>{headline}</h2>
          <p className={styles.specCaption}>
            {attacker.name} uses {move.name} on {defender.name}. {matchup}
          </p>
          <div className={styles.specBar}>
            <div className={styles.specBarFill} style={{ width: `${r.pctHi}%` }} />
          </div>
          <p className={styles.specCaption}>
            {r.pctHi}% of opponent HP in one hit · best case.
          </p>
        </div>
        <div className={styles.specStatRows}>
          <div>
            <span>type effectiveness</span>
            <span>{fmtEffect(r.effect)}</span>
          </div>
          <div>
            <span>damage low</span>
            <span>{r.lo}</span>
          </div>
          <div>
            <span>damage high</span>
            <span>{r.hi}</span>
          </div>
          <div>
            <span>% of HP, lo–hi</span>
            <span>
              {r.pctLo}–{r.pctHi}%
            </span>
          </div>
          <div>
            <span>opponent HP</span>
            <span>{defender.hp}</span>
          </div>
          <div>
            <span>hits to KO</span>
            <span>{Number.isFinite(r.hitsToKO) ? r.hitsToKO : '—'}</span>
          </div>
          <div>
            <span>verdict</span>
            <span>{r.verdict}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
