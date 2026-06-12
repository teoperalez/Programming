'use client';

import { useEffect, useRef } from 'react';

/**
 * Animated SVG architecture diagram for the overlay-family case study.
 * Shows: AhShuckie (Rust emu) → RBY-GameHook (.NET 8 poller) → NewLayout
 * overlay (Electron + React) → MongoDB + OBS. Real ports labeled.
 * The "poll packet" travels along the wires on a loop.
 */
export default function ArchOverlay() {
  const dotsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const dots = dotsRef.current?.querySelectorAll<SVGCircleElement>('.flow');
      dots?.forEach((c, i) => {
        const phase = (t + i * 0.5) % 2.4;
        c.style.opacity = phase < 1.2 ? '1' : '0';
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      viewBox="0 0 600 460"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="wire" x1="0" x2="1">
          <stop offset="0" stopColor="#ff3c25" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#ff3c25" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ff3c25" stopOpacity="0.1" />
        </linearGradient>
        <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff3c25" />
        </marker>
      </defs>

      {/* boxes */}
      <g fontFamily="Geist, Inter, sans-serif" fill="#f4ecdc">
        {/* emulator */}
        <rect x="20" y="60" width="180" height="92" rx="10" fill="#15151e" stroke="rgba(244,236,220,0.18)" />
        <text x="110" y="92" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontSize="22">AhShuckie</text>
        <text x="110" y="114" textAnchor="middle" fontSize="11" fill="#8a8377">rust · 60–600 fps</text>
        <text x="110" y="134" textAnchor="middle" fontSize="10" fill="#6cf4d2" fontFamily="JetBrains Mono">127.0.0.1:55356</text>

        {/* poller */}
        <rect x="400" y="60" width="180" height="92" rx="10" fill="#15151e" stroke="rgba(244,236,220,0.18)" />
        <text x="490" y="92" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontSize="22">GameHook</text>
        <text x="490" y="114" textAnchor="middle" fontSize="11" fill="#8a8377">.net 8 · single-file</text>
        <text x="490" y="134" textAnchor="middle" fontSize="10" fill="#6cf4d2" fontFamily="JetBrains Mono">localhost:8085</text>

        {/* overlay */}
        <rect x="120" y="200" width="360" height="104" rx="10" fill="#15151e" stroke="rgba(244,236,220,0.18)" />
        <text x="300" y="236" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontSize="28" fill="#ffb800">RBY / GSC / RSE NewLayout</text>
        <text x="300" y="260" textAnchor="middle" fontSize="11" fill="#8a8377">electron · react · canvas</text>
        <text x="300" y="282" textAnchor="middle" fontSize="11" fill="#f4ecdc">damage calc · TTKO · markers · tier cards</text>

        {/* mongo */}
        <rect x="20" y="350" width="200" height="84" rx="10" fill="#15151e" stroke="rgba(244,236,220,0.18)" />
        <text x="120" y="382" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontSize="20">Mongo Atlas</text>
        <text x="120" y="404" textAnchor="middle" fontSize="11" fill="#8a8377">run logs · TTKO history</text>

        {/* obs */}
        <rect x="380" y="350" width="200" height="84" rx="10" fill="#15151e" stroke="rgba(244,236,220,0.18)" />
        <text x="480" y="382" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontSize="20">OBS Studio</text>
        <text x="480" y="404" textAnchor="middle" fontSize="11" fill="#8a8377">chapter markers · scenes</text>
      </g>

      {/* wires */}
      <g stroke="url(#wire)" strokeWidth="1.5" fill="none" markerEnd="url(#ah)">
        <line x1="200" y1="106" x2="400" y2="106" />
        <line x1="490" y1="152" x2="380" y2="200" />
        <line x1="220" y1="304" x2="160" y2="350" />
        <line x1="380" y1="304" x2="440" y2="350" />
      </g>

      {/* flow dots */}
      <g ref={dotsRef}>
        <circle className="flow" cx="300" cy="106" r="3.5" fill="#ff3c25" />
        <circle className="flow" cx="436" cy="176" r="3.5" fill="#ff3c25" />
        <circle className="flow" cx="190" cy="327" r="3.5" fill="#ff3c25" />
        <circle className="flow" cx="412" cy="327" r="3.5" fill="#ff3c25" />
      </g>

      {/* labels */}
      <g fontFamily="JetBrains Mono" fontSize="10" fill="#8a8377">
        <text x="300" y="98" textAnchor="middle">poll · 600 Hz</text>
        <text x="445" y="190" textAnchor="middle">ws</text>
      </g>
    </svg>
  );
}
