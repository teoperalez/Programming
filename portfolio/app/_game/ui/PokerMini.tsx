'use client';

import { useEffect, useRef, useState } from 'react';
import {
  emptyEquity, equityPct, makeDeck, runBatch, shuffle,
  type Card, type EquityState,
} from '@/lib/poker';

interface Props { onClose: () => void; }

const TARGET = 30_000;
const BATCH = 500;
const isRed = (c: Card) => c[1] === 'h' || c[1] === 'd';

export default function PokerMini({ onClose }: Props) {
  const [h1, setH1] = useState<Card[]>(['As', 'Kh']);
  const [h2, setH2] = useState<Card[]>(['Qd', 'Qc']);
  const [eq, setEq] = useState<EquityState>(emptyEquity());
  const [running, setRunning] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const stop = () => {
    setRunning(false);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };
  const reset = () => { setEq(emptyEquity()); stop(); };
  const run = () => {
    if (h1.length !== 2 || h2.length !== 2) return;
    const fresh = emptyEquity();
    setEq(fresh);
    setRunning(true);
    const step = () => {
      runBatch(h1, h2, fresh, BATCH);
      setEq({ ...fresh });
      if (fresh.iters < TARGET) rafRef.current = requestAnimationFrame(step);
      else { setRunning(false); rafRef.current = null; }
    };
    rafRef.current = requestAnimationFrame(step);
  };
  const random = () => {
    const d = shuffle(makeDeck());
    setH1([d[0], d[1]]);
    setH2([d[2], d[3]]);
    reset();
  };

  const remaining = makeDeck().filter((c) => !h1.includes(c) && !h2.includes(c));

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(7,7,11,0.92)', backdropFilter: 'blur(12px)',
      zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 760, background: '#0e0d18', border: '1px solid rgba(244,236,220,0.18)', borderRadius: 12,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        fontFamily: 'JetBrains Mono, monospace', color: '#f4ecdc', overflow: 'hidden',
      }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(244,236,220,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ margin: 0, fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontSize: 28, fontWeight: 400 }}>
            monte-carlo equity
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(244,236,220,0.2)', color: '#f4ecdc', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            close [esc]
          </button>
        </div>
        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { side: 1 as const, label: 'hand a', hand: h1, set: setH1 },
            { side: 2 as const, label: 'hand b', hand: h2, set: setH2 },
          ].map(({ side, label, hand, set }) => {
            const pct = equityPct(eq, side);
            return (
              <div key={side} style={{ padding: 14, border: '1px solid rgba(244,236,220,0.18)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a8377', marginBottom: 8 }}>
                  {label} ({hand.length}/2)
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {hand.map((c) => (
                    <span key={c}
                      onClick={() => { set(hand.filter((x) => x !== c)); reset(); }}
                      style={{ padding: '4px 8px', border: '1px solid rgba(244,236,220,0.25)', borderRadius: 4, color: isRed(c) ? '#ff3c25' : '#f4ecdc', cursor: 'pointer', fontSize: 13 }}
                    >{c}</span>
                  ))}
                </div>
                {hand.length < 2 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed rgba(244,236,220,0.15)', display: 'flex', flexWrap: 'wrap', gap: 3, maxHeight: 76, overflowY: 'auto' }}>
                    {remaining.map((c) => (
                      <span key={c} onClick={() => { set([...hand, c]); reset(); }}
                        style={{ padding: '2px 6px', border: '1px solid rgba(244,236,220,0.1)', borderRadius: 3, color: isRed(c) ? '#ff3c25' : '#d8cfbe', cursor: 'pointer', fontSize: 11 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 12, fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontSize: 28 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a8377', fontStyle: 'normal', display: 'block' }}>equity</span>
                  {pct.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '0 32px 24px', display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8a8377', textTransform: 'uppercase' }}>
            {eq.iters.toLocaleString()} boards
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={running ? stop : run} disabled={h1.length !== 2 || h2.length !== 2}
              style={{ padding: '8px 16px', background: '#ff3c25', color: '#07070b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: h1.length !== 2 || h2.length !== 2 ? 0.4 : 1 }}>
              {running ? 'stop' : 'run 30k'}
            </button>
            <button onClick={reset} style={{ padding: '8px 16px', background: 'transparent', color: '#f4ecdc', border: '1px solid rgba(244,236,220,0.2)', borderRadius: 6, cursor: 'pointer', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              reset
            </button>
            <button onClick={random} style={{ padding: '8px 16px', background: 'transparent', color: '#f4ecdc', border: '1px solid rgba(244,236,220,0.2)', borderRadius: 6, cursor: 'pointer', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              random
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
