'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import s from './Lab.module.css';
import {
  emptyEquity,
  equityPct,
  makeDeck,
  runBatch,
  shuffle,
  type Card,
  type EquityState,
} from '@/lib/poker';

const TARGET = 30_000;
const BATCH = 480;

const isRed = (c: Card) => c[1] === 'h' || c[1] === 'd';

export default function PokerPanel() {
  const [h1, setH1] = useState<Card[]>(['As', 'Kh']);
  const [h2, setH2] = useState<Card[]>(['Qd', 'Qc']);
  const [eq, setEq] = useState<EquityState>(emptyEquity());
  const [running, setRunning] = useState(false);
  const rafRef = useRef<number | null>(null);

  const remaining = useMemo(
    () => makeDeck().filter((c) => !h1.includes(c) && !h2.includes(c)),
    [h1, h2],
  );

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const stop = () => {
    setRunning(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };
  const reset = () => {
    setEq(emptyEquity());
    stop();
  };
  const run = () => {
    if (h1.length !== 2 || h2.length !== 2) return;
    const fresh = emptyEquity();
    setEq(fresh);
    setRunning(true);
    const step = () => {
      runBatch(h1, h2, fresh, BATCH);
      setEq({ ...fresh });
      if (fresh.iters < TARGET) rafRef.current = requestAnimationFrame(step);
      else {
        setRunning(false);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };
  const random = () => {
    const d = shuffle(makeDeck());
    setH1([d[0], d[1]]);
    setH2([d[2], d[3]]);
    setEq(emptyEquity());
    stop();
  };

  const addTo = (side: 1 | 2, c: Card) => {
    if (side === 1 && h1.length < 2) {
      setH1([...h1, c]);
      reset();
    } else if (side === 2 && h2.length < 2) {
      setH2([...h2, c]);
      reset();
    }
  };
  const remove = (side: 1 | 2, c: Card) => {
    if (side === 1) setH1(h1.filter((x) => x !== c));
    else setH2(h2.filter((x) => x !== c));
    reset();
  };

  const a = equityPct(eq, 1);
  const b = equityPct(eq, 2);
  const t = eq.iters ? (eq.tie / eq.iters) * 100 : 0;
  const rawA = eq.iters ? (eq.w1 / eq.iters) * 100 : 0;
  const rawB = eq.iters ? (eq.w2 / eq.iters) * 100 : 0;

  return (
    <article className={s.panel}>
      <div className={s.panelHead}>
        <h3 className={s.panelTitle}>monte-carlo equity</h3>
        <span className={s.panelMeta}>50k boards · live</span>
      </div>
      <p className={s.panelDesc}>
        A 7-card evaluator from PokerSolver, stripped for the browser. Pick two hands and watch the
        equity bar converge across 30k random boards.
      </p>

      <div className={s.panelBody}>
        <div className={s.pokerHands}>
          {[
            { side: 1 as const, label: 'hand a', hand: h1 },
            { side: 2 as const, label: 'hand b', hand: h2 },
          ].map(({ side, label, hand }) => (
            <div className={s.pokerSide} key={side}>
              <h5>
                <span>{label}</span>
                <span>{hand.length}/2</span>
              </h5>
              <div className={s.pokerCards}>
                {hand.map((c) => (
                  <span
                    key={c}
                    className={`${s.pcard} ${isRed(c) ? s.red : ''}`}
                    onClick={() => remove(side, c)}
                    title="click to remove"
                  >
                    {c}
                  </span>
                ))}
              </div>
              {hand.length < 2 && (
                <div className={s.pokerTray}>
                  {remaining.map((c) => (
                    <span
                      key={c}
                      className={`${s.pcard} ${s.tray} ${isRed(c) ? s.red : ''}`}
                      onClick={() => addTo(side, c)}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
              <div className={s.pokerEq}>
                <span className="lbl-mute" style={{
                  display: 'block',
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--paper-mute)',
                  fontStyle: 'normal',
                }}>equity</span>
                {(side === 1 ? a : b).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        <div className={s.histogram}>
          <h5>distribution · {eq.iters.toLocaleString()} boards</h5>
          <div className={s.histBar}>
            <div className={s.a} style={{ width: `${rawA}%` }}>
              {rawA > 8 && `A ${rawA.toFixed(0)}%`}
            </div>
            <div className={s.t} style={{ width: `${t}%` }}>
              {t > 5 && `T ${t.toFixed(0)}%`}
            </div>
            <div className={s.b} style={{ width: `${rawB}%` }}>
              {rawB > 8 && `B ${rawB.toFixed(0)}%`}
            </div>
          </div>
          <div className={s.pokerCtl}>
            <button onClick={running ? stop : run} disabled={h1.length !== 2 || h2.length !== 2}>
              {running ? 'stop' : 'run 30k'}
            </button>
            <button onClick={reset}>reset</button>
            <button onClick={random}>random hands</button>
          </div>
        </div>
      </div>
    </article>
  );
}
