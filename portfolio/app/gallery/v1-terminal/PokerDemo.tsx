'use client';

import { useEffect, useRef, useState } from 'react';
import {
  makeDeck,
  shuffle,
  runBatch,
  equityPct,
  emptyEquity,
  type Card,
  type EquityState,
} from '@/lib/poker';
import styles from './styles.module.css';

const TARGET = 50_000;
const BATCH = 800;

const isRed = (c: Card) => c[1] === 'h' || c[1] === 'd';

function pcardCls(c: Card, sel: boolean): string {
  const cls = [styles.pcard];
  if (isRed(c)) cls.push(styles.red);
  if (sel) cls.push(styles.sel);
  return cls.join(' ');
}

export default function PokerDemo() {
  const [h1, setH1] = useState<Card[]>(['As', 'Kh']);
  const [h2, setH2] = useState<Card[]>(['Qd', 'Qc']);
  const [eq, setEq] = useState<EquityState>(emptyEquity());
  const [running, setRunning] = useState(false);

  const simRef = useRef<EquityState>(emptyEquity());
  const rafRef = useRef(0);

  // Cancel any in-flight animation frame on unmount.
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const resetSim = () => {
    cancelAnimationFrame(rafRef.current);
    simRef.current = emptyEquity();
    setEq(emptyEquity());
    setRunning(false);
  };

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    setRunning(false);
  };

  const start = () => {
    if (h1.length < 2 || h2.length < 2) return;
    cancelAnimationFrame(rafRef.current);
    setRunning(true);
    const step = () => {
      runBatch(h1, h2, simRef.current, BATCH);
      setEq({ ...simRef.current });
      if (simRef.current.iters < TARGET) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setRunning(false);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const removeCard = (side: 1 | 2, i: number) => {
    (side === 1 ? setH1 : setH2)((h) => h.filter((_, k) => k !== i));
    resetSim();
  };

  const addCard = (side: 1 | 2, c: Card) => {
    const hand = side === 1 ? h1 : h2;
    if (hand.length >= 2) return;
    (side === 1 ? setH1 : setH2)((h) => [...h, c]);
    resetSim();
  };

  const randomHands = () => {
    const d = shuffle(makeDeck());
    setH1([d[0], d[1]]);
    setH2([d[2], d[3]]);
    resetSim();
  };

  const tray = makeDeck().filter((c) => !h1.includes(c) && !h2.includes(c));

  const renderSide = (label: string, hand: Card[], side: 1 | 2) => {
    const need = 2 - hand.length;
    return (
      <div className={styles.pokerSide}>
        <h4 className={styles.pokerSideHead}>
          {label}
          <span>{hand.join(' ')}</span>
        </h4>
        <div className={styles.pokerCards}>
          {hand.map((c, i) => (
            <button key={c} type="button" className={pcardCls(c, true)} onClick={() => removeCard(side, i)}>
              {c}
            </button>
          ))}
        </div>
        <div className={styles.pickHint}>
          {need > 0 ? `↓ pick ${need} card${need === 1 ? '' : 's'}` : 'tap a card to remove'}
        </div>
        {need > 0 && (
          <div className={`${styles.pokerCards} ${styles.tray}`}>
            {tray.map((c) => (
              <button key={c} type="button" className={pcardCls(c, false)} onClick={() => addCard(side, c)}>
                {c}
              </button>
            ))}
          </div>
        )}
        <div className={styles.pokerEq}>
          equity
          <span className={styles.pct}>{equityPct(eq, side).toFixed(2)}%</span>
          {eq.iters.toLocaleString()} boards
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className={styles.pokerGrid}>
        {renderSide('hand A', h1, 1)}
        {renderSide('hand B', h2, 2)}
      </div>
      <div className={styles.pokerControls}>
        <button type="button" className={styles.btn} onClick={running ? stop : start}>
          {running ? '■ stop' : '▶ run 50k boards'}
        </button>
        <button type="button" className={styles.btn} onClick={resetSim}>
          reset
        </button>
        <button type="button" className={styles.btn} onClick={randomHands}>
          🎲 random hands
        </button>
      </div>
    </div>
  );
}
