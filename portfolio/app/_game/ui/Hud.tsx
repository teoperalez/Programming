'use client';

import { useEffect, useState } from 'react';
import { CONTACT } from '@/lib/projects';

interface Props {
  flags: Set<string>;
  visited: Set<string>;
  onMenuOpen: () => void;
}

const ALL_BUILDINGS = ['GSCNewLayout', 'RBY-GameHook', 'IRLPC Hyperframes', 'AhShuckie', 'PokerSolver', 'house', 'archive', 'contact'];

export default function Hud({ visited, onMenuOpen }: Props) {
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 8000);
    return () => clearTimeout(t);
  }, []);

  const found = ALL_BUILDINGS.filter((id) => visited.has(id)).length;

  return (
    <>
      {/* top-left identity */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          left: 12,
          padding: '8px 14px',
          borderRadius: 6,
          background: 'rgba(7,7,11,0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(244,236,220,0.12)',
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#f4ecdc',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        <span style={{ color: '#ff3c25', marginRight: 8 }}>●</span>
        {CONTACT.name} · frontend engineer · open to work
      </div>

      {/* top-right buttons (menu + read mode) */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          display: 'flex',
          gap: 8,
          zIndex: 5,
        }}
      >
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); onMenuOpen(); }}
          style={hudBtn}
        >
          MENU [M]
        </a>
        <a href="/gallery" style={hudBtn}>
          GALLERY [↗]
        </a>
      </div>

      {/* bottom-right progress */}
      <div
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          padding: '8px 14px',
          borderRadius: 6,
          background: 'rgba(7,7,11,0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(244,236,220,0.12)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#8a8377',
          zIndex: 5,
        }}
      >
        <span style={{ color: '#ff3c25' }}>{found}</span>
        <span style={{ margin: '0 4px' }}>/</span>
        <span>{ALL_BUILDINGS.length} explored</span>
      </div>

      {/* opening hint */}
      {hint && (
        <div
          style={{
            position: 'fixed',
            bottom: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '14px 22px',
            borderRadius: 8,
            background: 'rgba(7,7,11,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #ff3c25',
            fontFamily: 'Press Start 2P, monospace',
            fontSize: 11,
            color: '#f4ecdc',
            textAlign: 'center',
            lineHeight: 1.8,
            zIndex: 4,
            animation: 'fade 0.6s 7s forwards',
          }}
        >
          WASD or ARROWS to walk · SPACE to interact · TAB for text-only view
        </div>
      )}

      <style>{`@keyframes fade { to { opacity: 0; transform: translateX(-50%) translateY(10px); } }`}</style>
    </>
  );
}

const hudBtn: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 6,
  background: 'rgba(7,7,11,0.7)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(244,236,220,0.12)',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: '#f4ecdc',
  cursor: 'pointer',
  textDecoration: 'none',
};
