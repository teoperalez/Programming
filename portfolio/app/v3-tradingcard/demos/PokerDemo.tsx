'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import s from '../styles.module.css';
import {
  emptyEquity,
  equityPct,
  makeDeck,
  runBatch,
  shuffle,
  type Card,
  type EquityState,
} from '@/lib/poker';

const TARGET = 50_000;
const BATCH = 600;

function isRed(c: Card) {
  return c[1] === 'h' || c[1] === 'd';
}

export default function PokerDemo() {
  const [h1, setH1] = useState<Card[]>(['As', 'Kh']);
  const [h2, setH2] = useState<Card[]>(['Qd', 'Qc']);
  const [eq, setEq] = useState<EquityState>(emptyEquity());
  const [running, setRunning] = useState(false);
  const rafRef = useRef<number | null>(null);

  const remaining = useMemo(
    () => makeDeck().filter((c) => !h1.includes(c) && !h2.includes(c)),
    [h1, h2],
  );

  const reset = () => {
    setEq(emptyEquity());
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  // cancel pending raf on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const start = () => {
    if (h1.length !== 2 || h2.length !== 2) return;
    const fresh = emptyEquity();
    setEq(fresh);
    setRunning(true);
    const step = () => {
      runBatch(h1, h2, fresh, BATCH);
      setEq({ ...fresh });
      if (fresh.iters < TARGET) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setRunning(false);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const stop = () => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const random = () => {
    const d = shuffle(makeDeck());
    setH1([d[0], d[1]]);
    setH2([d[2], d[3]]);
    setEq(emptyEquity());
    stop();
  };

  const renderSide = (label: 'A' | 'B', hand: Card[], setHand: (c: Card[]) => void) => {
    const add = (c: Card) => {
      if (hand.length < 2) {
        setHand([...hand, c]);
        setEq(emptyEquity());
        stop();
      }
    };
    const remove = (c: Card) => {
      setHand(hand.filter((x) => x !== c));
      setEq(emptyEquity());
      stop();
    };
    const pct = equityPct(eq, label === 'A' ? 1 : 2);
    return (
      <div className={s.pokerSide}>
        <h4>
          <span>HAND {label}</span>
          <span>{hand.join(' ') || '— pick 2 —'}</span>
        </h4>
        <div className={s.pokerCards}>
          {hand.map((c) => (
            <span
              key={c}
              className={`${s.pcard} ${s.sel} ${isRed(c) ? s.red : ''}`}
              onClick={() => remove(c)}
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
                className={`${s.pcard} ${isRed(c) ? s.red : ''}`}
                onClick={() => add(c)}
              >
                {c}
              </span>
            ))}
          </div>
        )}
        <div className={s.pokerEq}>
          equity
          <b>{pct.toFixed(2)}%</b>
          {eq.iters.toLocaleString()} boards
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
        {renderSide('A', h1, setH1)}
        {renderSide('B', h2, setH2)}
      </div>
      <div className={s.pokerCtl}>
        <button onClick={running ? stop : start} disabled={h1.length !== 2 || h2.length !== 2}>
          {running ? '■ stop' : '▶ run 50k boards'}
        </button>
        <button onClick={reset}>reset</button>
        <button onClick={random}>🎲 random hands</button>
      </div>
    </>
  );
}
