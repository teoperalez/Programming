'use client';

import { useEffect, useRef, useState } from 'react';
import { bus } from '../engine/EventBus';

interface Props {
  lines: string[];
  speaker?: string;
  onClose: () => void;
}

const CPS = 80; // chars per second typewriter

export default function DialogBox({ lines, speaker, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [charsShown, setCharsShown] = useState(0);
  const startRef = useRef(performance.now());

  const current = lines[idx] ?? '';
  const complete = charsShown >= current.length;

  // typewriter
  useEffect(() => {
    startRef.current = performance.now();
    setCharsShown(0);
    let raf = 0;
    const tick = () => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      const c = Math.min(current.length, Math.floor(elapsed * CPS));
      setCharsShown(c);
      if (c < current.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current]);

  // advance handler — engine emits dialog:advance on confirm/cancel
  useEffect(() => {
    const off = bus.on('dialog:advance', () => {
      if (!complete) {
        setCharsShown(current.length);
        return;
      }
      if (idx < lines.length - 1) {
        setIdx((i) => i + 1);
        bus.emit('audio:play', { sound: 'select' });
      } else {
        bus.emit('audio:play', { sound: 'close' });
        bus.emit('dialog:closed', undefined);
        onClose();
      }
    });
    return off;
  }, [complete, idx, lines.length, current, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 'clamp(12px, 3vw, 32px)',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '18px 22px 22px',
          background: '#0e0d18',
          border: '3px solid #f4ecdc',
          borderRadius: 6,
          boxShadow: '0 12px 32px rgba(0,0,0,0.5), inset 0 0 0 1px #2b2a36',
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          color: '#f4ecdc',
          pointerEvents: 'auto',
        }}
      >
        {speaker && (
          <div
            style={{
              fontFamily: 'Press Start 2P, monospace',
              fontSize: 10,
              letterSpacing: '0.15em',
              color: '#ff3c25',
              marginBottom: 12,
            }}
          >
            ▸ {speaker}
          </div>
        )}
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            minHeight: '3.4em',
          }}
        >
          {current.slice(0, charsShown)}
          {!complete && <span style={{ color: '#ff3c25', animation: 'blink 1s steps(1) infinite' }}>▍</span>}
        </div>
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 10,
            color: '#8a8377',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          <span>{idx + 1} / {lines.length}</span>
          <span>
            {complete ? (idx < lines.length - 1 ? 'SPACE  ▶  more' : 'SPACE  ▶  close') : 'SPACE  ▶  skip'}
          </span>
        </div>
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}
