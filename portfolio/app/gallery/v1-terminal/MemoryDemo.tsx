'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

const COLS = 32;
const ROWS = 16;
const N = COLS * ROWS;
const RATES = [60, 200, 600, 1200];
const PAINT_FPS = 30;
const MAX_EVENTS = 5;

interface MemEvent {
  id: number;
  time: string;
  name: string;
  addr: number;
  val: number;
}

export default function MemoryDemo() {
  const [hz, setHz] = useState(600);
  // Bumped at paint rate so React re-reads the mutable sim buffers below.
  const [, setFrame] = useState(0);

  const memRef = useRef<Uint8Array>(new Uint8Array(N));
  const eventsRef = useRef<MemEvent[]>([]);
  const eventIdRef = useRef(0);

  useEffect(() => {
    const mem = memRef.current;
    let simTimer: number | null = null;
    let paintTimer: number | null = null;

    const pushEvt = (name: string, addr: number, val: number) => {
      const time = new Date().toTimeString().slice(0, 8);
      eventsRef.current = [
        { id: eventIdRef.current++, time, name, addr, val },
        ...eventsRef.current,
      ].slice(0, MAX_EVENTS);
    };

    const tick = () => {
      const change = Math.random();
      const idx = (Math.random() * N) | 0;
      const wasBattle = mem[20] !== 0;
      if (change < 0.6) mem[idx] = (Math.random() * 255) | 0;
      if (change < 0.02 && !wasBattle) {
        mem[20] = 1;
        pushEvt('battle_started', 0x0014, 1);
      } else if (change < 0.04 && wasBattle) {
        mem[20] = 0;
        pushEvt('battle_ended', 0x0014, 0);
      } else if (change < 0.08) {
        mem[55] = (Math.random() * 4) | 0;
        pushEvt('encounter_type', 0x0037, mem[55]);
      }
    };

    const stop = () => {
      if (simTimer !== null) {
        clearInterval(simTimer);
        simTimer = null;
      }
      if (paintTimer !== null) {
        clearInterval(paintTimer);
        paintTimer = null;
      }
    };

    const start = () => {
      stop();
      // setInterval clamps near 4 ms, so simulate high rates by running
      // multiple mutations per tick — the *simulated* poll rate stays honest.
      const intervalMs = Math.max(4, 1000 / hz);
      const perTick = Math.max(1, Math.round((hz * intervalMs) / 1000));
      simTimer = window.setInterval(() => {
        for (let i = 0; i < perTick; i++) tick();
      }, intervalMs);
      paintTimer = window.setInterval(() => setFrame((f) => f + 1), 1000 / PAINT_FPS);
    };

    // Pause the poller entirely while the tab is hidden.
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hz]);

  const mem = memRef.current;

  return (
    <div>
      <div className={styles.memMeta}>
        <span>PokeAByte shared memory · 0x0000–0x01FF</span>
        <span>rate: {hz} Hz</span>
      </div>
      <div className={styles.memGrid}>
        {Array.from({ length: N }, (_, i) => {
          const v = mem[i];
          const hot = (i === 20 && mem[20] !== 0) || (i === 55 && mem[55] !== 0);
          const cls = hot
            ? `${styles.memCell} ${styles.hot}`
            : v > 200
              ? `${styles.memCell} ${styles.warm}`
              : styles.memCell;
          return <div key={i} className={cls} style={{ opacity: v ? 0.25 + (v / 255) * 0.75 : 0.15 }} />;
        })}
      </div>
      <div className={styles.memCtl}>
        {RATES.map((rt) => (
          <button
            key={rt}
            type="button"
            className={rt === hz ? `${styles.btn} ${styles.btnActive}` : styles.btn}
            onClick={() => setHz(rt)}
          >
            {rt} Hz
          </button>
        ))}
      </div>
      <div className={styles.memEvts}>
        {eventsRef.current.map((e) => (
          <div key={e.id} className={styles.memEvt}>
            {`[${e.time}] EVT ${e.name.padEnd(20)} addr=0x${e.addr.toString(16).padStart(4, '0')}  val=${e.val}`}
          </div>
        ))}
      </div>
    </div>
  );
}
