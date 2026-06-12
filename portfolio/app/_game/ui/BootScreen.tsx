'use client';

import { useEffect, useState } from 'react';
import { PROJECTS } from '@/lib/projects';

const KERNEL_LINES = [
  '[ ok ] teoOS 2.1 booting...',
  '[ ok ] mounting filesystem /portfolio',
  '[ ok ] initialising game engine (typescript, no framework)',
  '[ ok ] procedural tile atlas generated (8x4 @ 16px)',
  `[ ok ] loaded ${PROJECTS.length} projects from lib/projects.ts`,
  '[ ok ] starting input subsystem (keyboard + gamepad + virtual)',
  '[ ok ] starting audio subsystem (web audio, lazy)',
  '[ ok ] world ready  ·  48x36 tiles  ·  6 buildings  ·  5 npcs',
  '',
  '> press SPACE to start',
];

interface Props { onDone: () => void; }

export default function BootScreen({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= KERNEL_LINES.length - 1) {
          clearInterval(t);
          setDone(true);
          return s;
        }
        return s + 1;
      });
    }, 110);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done && (e.code === 'Space' || e.code === 'Enter')) onDone();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, onDone]);

  return (
    <div
      role="status"
      onClick={() => done && onDone()}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#07070b',
        color: '#6cf4d2',
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        fontSize: 14,
        lineHeight: 1.65,
        padding: 'clamp(20px, 4vw, 80px)',
        cursor: done ? 'pointer' : 'default',
      }}
    >
      <pre
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          color: '#ff3c25',
          margin: '0 0 24px',
          textShadow: '0 0 12px rgba(255,60,37,0.4)',
          whiteSpace: 'pre',
          overflow: 'hidden',
        }}
      >
{` ████████╗███████╗ ██████╗     ██████╗ ███████╗██████╗  █████╗ ██╗     ███████╗███████╗
 ╚══██╔══╝██╔════╝██╔═══██╗    ██╔══██╗██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝╚══███╔╝
    ██║   █████╗  ██║   ██║    ██████╔╝█████╗  ██████╔╝███████║██║     █████╗    ███╔╝
    ██║   ██╔══╝  ██║   ██║    ██╔═══╝ ██╔══╝  ██╔══██╗██╔══██║██║     ██╔══╝   ███╔╝
    ██║   ███████╗╚██████╔╝    ██║     ███████╗██║  ██║██║  ██║███████╗███████╗███████╗
    ╚═╝   ╚══════╝ ╚═════╝     ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝`}
      </pre>
      <p style={{ color: '#8a8377', margin: '0 0 36px' }}>
        // playable portfolio · 2D RPG · custom typescript engine · press TAB at any time for a readable resume view
      </p>
      <div>
        {KERNEL_LINES.slice(0, step + 1).map((line, i) => (
          <div
            key={i}
            style={{
              color: line.startsWith('[ ok ]') ? '#6cf4d2' : line.startsWith('>') ? '#ffb800' : '#f4ecdc',
              opacity: i === step ? 1 : 0.7,
            }}
          >
            {line}
            {i === KERNEL_LINES.length - 1 && done && (
              <span style={{ color: '#ff3c25', marginLeft: 8, animation: 'blink 1s steps(1) infinite' }}>▍</span>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}
