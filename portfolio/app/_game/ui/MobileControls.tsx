'use client';

import { useEffect, useState } from 'react';
import type { GameKey } from '../engine/Input';

interface Props {
  onDir: (key: GameKey, down: boolean) => void;
  onConfirm: () => void;
  onMenu: () => void;
}

/** On-screen d-pad + A button for coarse-pointer devices. */
export default function MobileControls({ onDir, onConfirm, onMenu }: Props) {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setCoarse(mq.matches);
    const fn = () => setCoarse(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  if (!coarse) return null;

  const padBtn = (label: string, key: GameKey, style: React.CSSProperties) => (
    <button
      onTouchStart={(e) => { e.preventDefault(); onDir(key, true); }}
      onTouchEnd={(e) => { e.preventDefault(); onDir(key, false); }}
      onTouchCancel={() => onDir(key, false)}
      style={{
        position: 'absolute',
        width: 56, height: 56,
        background: 'rgba(7,7,11,0.7)',
        border: '2px solid rgba(244,236,220,0.4)',
        borderRadius: 12, color: '#f4ecdc',
        fontFamily: 'Press Start 2P, monospace', fontSize: 14,
        ...style,
        touchAction: 'none', userSelect: 'none',
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* d-pad bottom left */}
      <div style={{
        position: 'fixed', left: 20, bottom: 24,
        width: 168, height: 168,
        zIndex: 8,
      }}>
        {padBtn('▲', 'up', { left: 56, top: 0 })}
        {padBtn('▼', 'down', { left: 56, bottom: 0 })}
        {padBtn('◀', 'left', { left: 0, top: 56 })}
        {padBtn('▶', 'right', { right: 0, top: 56 })}
      </div>

      {/* a button bottom right */}
      <button
        onTouchStart={(e) => { e.preventDefault(); onConfirm(); }}
        style={{
          position: 'fixed', right: 28, bottom: 28,
          width: 80, height: 80,
          background: '#ff3c25', color: '#07070b',
          border: '3px solid #f4ecdc',
          borderRadius: '50%',
          fontFamily: 'Press Start 2P, monospace', fontSize: 22,
          touchAction: 'none', userSelect: 'none',
          zIndex: 8,
        }}
      >
        A
      </button>

      {/* menu bottom right above A */}
      <button
        onTouchStart={(e) => { e.preventDefault(); onMenu(); }}
        style={{
          position: 'fixed', right: 28, bottom: 124,
          width: 56, height: 56,
          background: 'rgba(7,7,11,0.7)',
          border: '2px solid rgba(244,236,220,0.4)',
          borderRadius: '50%',
          color: '#f4ecdc',
          fontFamily: 'Press Start 2P, monospace', fontSize: 10,
          touchAction: 'none', userSelect: 'none',
          zIndex: 8,
        }}
      >
        MENU
      </button>
    </>
  );
}
