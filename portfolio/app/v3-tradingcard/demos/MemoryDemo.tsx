'use client';

import { useEffect, useRef, useState } from 'react';
import s from '../styles.module.css';

const COLS = 24;
const ROWS = 12;
const N = COLS * ROWS;
const RATES = [60, 200, 600, 1200] as const;
type Rate = (typeof RATES)[number];

export default function MemoryDemo() {
  const [rate, setRate] = useState<Rate>(600);
  const [events, setEvents] = useState<string[]>([]);
  const cellsRef = useRef<HTMLDivElement[]>([]);
  const memRef = useRef<Uint8Array>(new Uint8Array(N));
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const mem = memRef.current;
      const v = Math.random();
      const idx = (Math.random() * N) | 0;
      if (v < 0.6) mem[idx] = (Math.random() * 255) | 0;
      // event triggers
      const wasBattle = mem[20] !== 0;
      let evt: string | null = null;
      if (v < 0.02 && !wasBattle) {
        mem[20] = 1;
        evt = `EVT battle_started addr=0x0014 val=1`;
      } else if (v < 0.04 && wasBattle) {
        mem[20] = 0;
        evt = `EVT battle_ended addr=0x0014 val=0`;
      } else if (v < 0.07) {
        mem[55] = (Math.random() * 4) | 0;
        evt = `EVT encounter_type addr=0x0037 val=${mem[55]}`;
      }

      // paint
      for (let i = 0; i < N; i++) {
        const el = cellsRef.current[i];
        if (!el) continue;
        const val = mem[i];
        const isBattle = (i === 20 && mem[20]) || (i === 55 && mem[55]);
        el.className = `${s.memCell} ${isBattle ? s.hot : val > 200 ? s.warm : ''}`;
        el.style.opacity = val ? String(0.3 + (val / 255) * 0.7) : '0.18';
      }

      if (evt) {
        const t = new Date().toISOString().slice(11, 19);
        setEvents((prev) => [`[${t}] ${evt}`, ...prev].slice(0, 5));
      }
    };

    const interval = window.setInterval(tick, Math.max(8, 1000 / rate));
    timerRef.current = interval;

    const onVis = () => {
      if (document.hidden && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [rate]);

  return (
    <>
      <p
        style={{
          fontFamily: 'var(--pixel)',
          fontSize: '9px',
          color: '#6b6675',
          margin: '6px 0 0',
        }}
      >
        ▼ PokeAByte shared memory · 0x0000–0x017F · live tap
      </p>
      <div className={s.memGrid}>
        {Array.from({ length: N }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) cellsRef.current[i] = el;
            }}
            className={s.memCell}
          />
        ))}
      </div>
      <div className={s.memCtl}>
        {RATES.map((r) => (
          <button
            key={r}
            className={r === rate ? s.active : ''}
            onClick={() => setRate(r)}
          >
            {r} Hz
          </button>
        ))}
      </div>
      <div className={s.memEvts}>
        {events.length === 0
          ? '> waiting for events…'
          : events.map((e, i) => <div key={i}>{`> ${e}`}</div>)}
      </div>
    </>
  );
}
