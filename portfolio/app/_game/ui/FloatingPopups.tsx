'use client';

import { useEffect, useState } from 'react';
import { bus } from '../engine/EventBus';

interface Popup {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  born: number;
}

/**
 * Floating screen-space popups: damage numbers, status pings. Subscribes
 * to fx:popup. Lives 0.9s, lifts up + fades out.
 */
export default function FloatingPopups() {
  const [pops, setPops] = useState<Popup[]>([]);
  const [, force] = useState(0);

  useEffect(() => {
    let id = 0;
    const off = bus.on('fx:popup', ({ x, y, text, color }) => {
      setPops((list) => [...list, {
        id: id++, text, x, y, color: color ?? '#ff3c25', born: performance.now(),
      }]);
    });
    return off;
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      setPops((list) => list.filter((p) => now - p.born < 900));
      force((n) => (n + 1) % 1000000);
      raf = requestAnimationFrame(tick);
    };
    if (pops.length) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pops.length]);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 7 }}>
      {pops.map((p) => {
        const t = Math.min(1, (performance.now() - p.born) / 900);
        const lift = Math.round(40 * t);
        const op = 1 - t * t;
        return (
          <div key={p.id} style={{
            position: 'absolute',
            left: p.x,
            top: p.y - lift,
            transform: 'translate(-50%, -50%)',
            color: p.color,
            fontFamily: 'Press Start 2P, monospace',
            fontSize: 18,
            opacity: op,
            textShadow: '2px 2px 0 #07070b',
            whiteSpace: 'nowrap',
          }}>
            {p.text}
          </div>
        );
      })}
    </div>
  );
}
