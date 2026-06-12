'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  hasSave: boolean;
  onStart: (fromSave: boolean) => void;
  onRead: () => void;
}

/**
 * Title screen with animated logo, blinking "PRESS START," parallax stars,
 * NEW GAME / CONTINUE / READABLE selection.
 */
export default function TitleScreen({ hasSave, onStart, onRead }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState(hasSave ? 1 : 0);

  const items = hasSave
    ? [
        { key: 'new', label: 'NEW GAME', sub: 'erase save · start fresh' },
        { key: 'cont', label: 'CONTINUE', sub: 'restore last position' },
        { key: 'read', label: 'READABLE VIEW', sub: 'skip the game' },
      ]
    : [
        { key: 'new', label: 'NEW GAME', sub: 'start in programming town' },
        { key: 'read', label: 'READABLE VIEW', sub: 'skip the game' },
      ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { setSel((s) => (s - 1 + items.length) % items.length); e.preventDefault(); }
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') { setSel((s) => (s + 1) % items.length); e.preventDefault(); }
      else if (e.code === 'Enter' || e.code === 'Space') {
        const it = items[sel];
        if (it.key === 'new') onStart(false);
        else if (it.key === 'cont') onStart(true);
        else onRead();
        e.preventDefault();
      } else if (e.code === 'Tab') {
        onRead();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel, items, onStart, onRead]);

  // animated starfield background
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      cv.width = Math.floor(cv.clientWidth * dpr);
      cv.height = Math.floor(cv.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    // generate stars: 3 layers
    const layers = [40, 60, 80].map((n, li) => Array.from({ length: n }, () => ({
      x: Math.random() * cv.clientWidth,
      y: Math.random() * cv.clientHeight,
      v: 4 + li * 10,
      s: 1 + li,
      twinkle: Math.random() * Math.PI * 2,
    })));

    let raf = 0;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      const w = cv.clientWidth, h = cv.clientHeight;
      // sky gradient
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0b0f23');
      g.addColorStop(0.55, '#19173a');
      g.addColorStop(1, '#3a1830');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // distant horizon glow
      const glow = ctx.createRadialGradient(w / 2, h * 0.75, 0, w / 2, h * 0.75, w);
      glow.addColorStop(0, 'rgba(255,184,0,0.10)');
      glow.addColorStop(0.4, 'rgba(255,60,37,0.06)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // stars
      for (const layer of layers) {
        for (const s of layer) {
          s.x -= s.v * dt;
          if (s.x < 0) { s.x = w; s.y = Math.random() * h; }
          s.twinkle += dt * 4;
          const a = 0.5 + 0.5 * Math.sin(s.twinkle);
          ctx.fillStyle = `rgba(244,236,220,${a * 0.85})`;
          ctx.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s);
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      color: '#f4ecdc',
    }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 36, padding: 'clamp(20px, 4vw, 40px)',
        textAlign: 'center',
      }}>
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            letterSpacing: '0.35em', color: '#ffb800',
            marginBottom: 18,
          }}>
            ◆ TEO PERALEZ ◆
          </div>
          <h1 style={{
            fontFamily: 'Press Start 2P, monospace',
            fontSize: 'clamp(36px, 7vw, 88px)',
            margin: 0, lineHeight: 1.08,
            color: '#ff3c25',
            textShadow: `
              3px 3px 0 #07070b,
              0 0 18px rgba(255,60,37,0.55),
              0 0 36px rgba(255,184,0,0.2)
            `,
            letterSpacing: 4,
          }}>
            PROGRAMMING
          </h1>
          <h1 style={{
            fontFamily: 'Press Start 2P, monospace',
            fontSize: 'clamp(36px, 7vw, 88px)',
            margin: '14px 0 0', lineHeight: 1.08,
            color: '#ffb800',
            textShadow: '3px 3px 0 #07070b, 0 0 18px rgba(255,184,0,0.45)',
            letterSpacing: 4,
          }}>
            TOWN
          </h1>
          <div style={{
            marginTop: 26,
            fontFamily: 'Instrument Serif, serif', fontStyle: 'italic',
            fontSize: 'clamp(16px, 2vw, 22px)',
            color: '#d8cfbe',
            maxWidth: 540, lineHeight: 1.5,
          }}>
            a playable portfolio · custom typescript engine
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          minWidth: 340, maxWidth: '90%',
          padding: '18px 0',
        }}>
          {items.map((it, i) => (
            <button
              key={it.key}
              onMouseEnter={() => setSel(i)}
              onClick={() => {
                if (it.key === 'new') onStart(false);
                else if (it.key === 'cont') onStart(true);
                else onRead();
              }}
              style={{
                background: i === sel ? 'rgba(255,60,37,0.18)' : 'transparent',
                border: i === sel ? '2px solid #ff3c25' : '2px solid rgba(244,236,220,0.18)',
                borderRadius: 8,
                padding: '14px 22px',
                color: '#f4ecdc',
                fontFamily: 'JetBrains Mono, monospace',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                boxShadow: i === sel ? '0 0 24px rgba(255,60,37,0.25)' : 'none',
              }}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{
                  fontSize: 16, letterSpacing: '0.12em',
                  color: i === sel ? '#ff3c25' : '#f4ecdc',
                  fontWeight: 600,
                }}>
                  {i === sel && <span style={{ marginRight: 10 }}>▶</span>}
                  {it.label}
                </span>
                {it.key === 'cont' && hasSave && (
                  <span style={{ fontSize: 10, color: '#6cf4d2', letterSpacing: '0.15em' }}>SAVE FOUND</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#8a8377', marginTop: 4, letterSpacing: '0.1em' }}>
                {it.sub}
              </div>
            </button>
          ))}
        </div>

        <div style={{
          fontSize: 10, color: '#6b6675',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          fontFamily: 'JetBrains Mono, monospace',
          textAlign: 'center', lineHeight: 1.8,
        }}>
          ↑↓ NAVIGATE  ·  SPACE / ENTER SELECT  ·  TAB TEXT-ONLY VIEW
          <br/>
          <span style={{ color: '#8a8377', textTransform: 'none', fontSize: 11, letterSpacing: '0.1em' }}>
            built by Teo Peralez — open to frontend roles
          </span>
        </div>
      </div>
    </div>
  );
}
