'use client';

import { useEffect, useRef, useState } from 'react';

const COLS = 32;
const ROWS = 14;
const N = COLS * ROWS;

/**
 * Cinematic memory-poller viz. Renders a 32×14 cell grid that mutates at
 * 600 Hz (simulated). When a cell crosses a threshold, the "battle started"
 * event listener fires and a thin red flash sweeps the grid. Soft glow per
 * cell, no harsh edges. The visual proxy for what RBY-GameHook does live
 * against a running emulator.
 */
export default function MemoryViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    mem: new Float32Array(N),
    flash: 0,
    events: 0,
    last: 0,
  });
  const [evtCount, setEvtCount] = useState(0);
  const [hz, setHz] = useState(600);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      cv.width = Math.max(1, Math.floor(w * dpr));
      cv.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    let raf = 0;
    const draw = () => {
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      const st = stateRef.current;
      const now = performance.now();
      const dt = (now - st.last) / 1000;
      st.last = now;

      // simulate mutations at chosen rate
      const mutationsThisFrame = Math.min(220, Math.floor(hz * (dt || 0.016)));
      for (let m = 0; m < mutationsThisFrame; m++) {
        const idx = (Math.random() * N) | 0;
        // values drift, occasional spikes
        st.mem[idx] = Math.random() < 0.04 ? Math.random() : st.mem[idx] * 0.9 + Math.random() * 0.05;
        if (st.mem[idx] > 0.92) {
          st.flash = 1;
          st.events++;
        }
      }
      if (st.events !== evtCount) setEvtCount(st.events);
      st.flash *= 0.92;

      // paint
      ctx.fillStyle = '#0e0e14';
      ctx.fillRect(0, 0, w, h);

      const padX = 14, padY = 14;
      const cw = (w - padX * 2) / COLS;
      const ch = (h - padY * 2) / ROWS;
      const r = Math.min(cw, ch) * 0.36;

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const v = st.mem[y * COLS + x];
          if (v < 0.02) continue;
          const cx = padX + x * cw + cw / 2;
          const cy = padY + y * ch + ch / 2;
          // base
          ctx.beginPath();
          ctx.arc(cx, cy, r * (0.4 + v * 0.6), 0, Math.PI * 2);
          if (v > 0.85) {
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
            g.addColorStop(0, `rgba(255,184,0,${0.7 + v * 0.3})`);
            g.addColorStop(0.4, 'rgba(255,60,37,0.6)');
            g.addColorStop(1, 'rgba(255,60,37,0)');
            ctx.fillStyle = g;
          } else if (v > 0.55) {
            ctx.fillStyle = `rgba(255,60,37,${v * 0.8})`;
          } else {
            ctx.fillStyle = `rgba(108,244,210,${v * 0.45})`;
          }
          ctx.fill();
        }
      }

      // flash overlay
      if (st.flash > 0.02) {
        ctx.fillStyle = `rgba(255,60,37,${st.flash * 0.18})`;
        ctx.fillRect(0, 0, w, h);
      }

      raf = requestAnimationFrame(draw);
    };
    stateRef.current.last = performance.now();
    raf = requestAnimationFrame(draw);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        stateRef.current.last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [hz, evtCount]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 280,
          display: 'block',
          borderRadius: 10,
          border: '1px solid var(--line)',
          background: 'var(--ink)',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 14,
          gap: 14,
          flexWrap: 'wrap',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--paper-mute)',
        }}
      >
        <span>
          0x0000 — 0x{(N - 1).toString(16).padStart(4, '0').toUpperCase()} ·{' '}
          <span style={{ color: 'var(--plasma)' }}>{hz} Hz</span>
        </span>
        <span>
          events <b style={{ color: 'var(--fire)', fontFamily: 'var(--display)', fontStyle: 'italic', fontSize: 18 }}>{evtCount}</b>
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[60, 200, 600, 1200].map((r) => (
            <button
              key={r}
              onClick={() => setHz(r)}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.1em',
                padding: '4px 10px',
                border: '1px solid var(--line-2)',
                borderRadius: 999,
                color: r === hz ? 'var(--ink)' : 'var(--paper-mute)',
                background: r === hz ? 'var(--plasma)' : 'transparent',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {r} Hz
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
