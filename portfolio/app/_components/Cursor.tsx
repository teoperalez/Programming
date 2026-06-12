'use client';

import { useEffect, useRef } from 'react';

/**
 * Twin-element custom cursor: a small dot that tracks 1:1 with the pointer,
 * and a larger ring that follows on a spring. Grows when over interactive
 * elements. Hidden on touch / coarse-pointer devices.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    mx: -100,
    my: -100,
    rx: -100,
    ry: -100,
    scale: 1,
    targetScale: 1,
  });

  useEffect(() => {
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    if (isCoarse) return;

    document.body.classList.add('cursor-on');

    const move = (e: PointerEvent) => {
      stateRef.current.mx = e.clientX;
      stateRef.current.my = e.clientY;
    };
    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const interactive = t.closest('a, button, [role="button"], input, select, textarea, [data-cursor="hover"]');
      stateRef.current.targetScale = interactive ? 2.6 : 1;
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);

    let raf = 0;
    const tick = () => {
      const s = stateRef.current;
      s.rx += (s.mx - s.rx) * 0.18;
      s.ry += (s.my - s.ry) * 0.18;
      s.scale += (s.targetScale - s.scale) * 0.15;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${s.mx}px, ${s.my}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${s.rx}px, ${s.ry}px, 0) scale(${s.scale})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.body.classList.remove('cursor-on');
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 28,
          height: 28,
          marginLeft: -14,
          marginTop: -14,
          borderRadius: '50%',
          border: '1px solid var(--paper)',
          mixBlendMode: 'difference',
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform',
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          borderRadius: '50%',
          background: 'var(--fire)',
          pointerEvents: 'none',
          zIndex: 10000,
          willChange: 'transform',
        }}
      />
    </>
  );
}
