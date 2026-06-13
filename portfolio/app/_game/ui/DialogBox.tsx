'use client';

import { useEffect, useRef, useState } from 'react';
import { bus } from '../engine/EventBus';

interface Props {
  lines: string[];
  speaker?: string;
  onClose: () => void;
}

const CPS = 70; // chars per second typewriter (slightly slower for RBY feel)

/**
 * RBY-influenced dialog box:
 *   white background, thick black outer border + 1px inset gap +
 *   thin black inner border, top-left speaker chip, blinking ▼ marker
 *   when the line is complete and ready to advance.
 */
export default function DialogBox({ lines, speaker, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [charsShown, setCharsShown] = useState(0);
  const startRef = useRef(performance.now());

  const current = lines[idx] ?? '';
  const complete = charsShown >= current.length;

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
        padding: 'clamp(12px, 2.5vw, 24px)',
        zIndex: 10,
        pointerEvents: 'none',
        fontFamily: '"Press Start 2P", "JetBrains Mono", monospace',
        // global pixel-perfect rendering for the box
        imageRendering: 'pixelated',
      }}
    >
      {/* outer thick black border, inset white panel, inner thin black border */}
      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          background: '#000000',
          padding: 4,           // outer thick black
          pointerEvents: 'auto',
        }}
      >
        <div style={{
          background: '#ffffff',
          padding: 4,           // white inset gap (between thick + thin borders)
        }}>
          <div style={{
            background: '#ffffff',
            border: '2px solid #000000',
            padding: '16px 18px 14px',
            position: 'relative',
            color: '#000000',
          }}>
            {speaker && (
              <div style={{
                position: 'absolute',
                top: -12,
                left: 12,
                background: '#000000',
                color: '#ffffff',
                fontSize: 9,
                padding: '3px 8px',
                letterSpacing: '0.12em',
                imageRendering: 'pixelated',
              }}>
                ▸ {speaker}
              </div>
            )}
            <div style={{
              fontSize: 12,
              lineHeight: 1.85,
              minHeight: '5.5em',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: '#1a1a1a',
            }}>
              {current.slice(0, charsShown)}
              {!complete && <span style={{ color: '#1a1a1a', animation: 'blink 1s steps(1) infinite' }}>_</span>}
              {complete && (
                <span style={{
                  display: 'inline-block',
                  marginLeft: 8,
                  color: '#1a1a1a',
                  animation: 'bounce 0.8s ease-in-out infinite',
                  transform: 'translateY(2px)',
                }}>
                  ▼
                </span>
              )}
            </div>
            <div style={{
              marginTop: 8,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 8,
              color: '#666',
              letterSpacing: '0.15em',
            }}>
              <span>{idx + 1} / {lines.length}</span>
              <span>
                {complete ? (idx < lines.length - 1 ? 'SPACE > MORE' : 'SPACE > CLOSE') : 'SPACE > SKIP'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes bounce {
          0%, 100% { transform: translateY(2px); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
