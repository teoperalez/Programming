'use client';

import { useEffect, useState } from 'react';
import { BUILDINGS } from '../data/world';

interface Props {
  visited: Set<string>;
  onClose: () => void;
  onJump: (projectId: string) => void;
  onReset: () => void;
  onReadMode: () => void;
  onTitle: () => void;
}

export default function PauseMenu({ visited, onClose, onJump, onReset, onReadMode, onTitle }: Props) {
  const [sel, setSel] = useState(0);
  const items = [
    ...BUILDINGS.map((b) => ({ kind: 'jump' as const, id: b.projectId, label: b.label, sub: b.sublabel, visited: visited.has(b.projectId) })),
    { kind: 'read' as const, id: 'read', label: 'TEXT-ONLY VIEW', sub: 'accessibility · tab key', visited: false },
    { kind: 'reset' as const, id: 'reset', label: 'TELEPORT TO PLAZA', sub: 'back to the fountain', visited: false },
    { kind: 'title' as const, id: 'title', label: 'BACK TO TITLE', sub: 'main menu', visited: false },
    { kind: 'close' as const, id: 'close', label: 'CLOSE MENU', sub: 'resume the game', visited: false },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { setSel((s) => (s - 1 + items.length) % items.length); e.preventDefault(); }
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') { setSel((s) => (s + 1) % items.length); e.preventDefault(); }
      else if (e.code === 'Enter' || e.code === 'Space') {
        const it = items[sel];
        if (it.kind === 'jump') onJump(it.id);
        else if (it.kind === 'read') onReadMode();
        else if (it.kind === 'reset') onReset();
        else if (it.kind === 'title') onTitle();
        else onClose();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel, items, onJump, onReadMode, onReset, onClose, onTitle]);

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(7,7,11,0.78)', backdropFilter: 'blur(6px)',
        zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 460, background: '#0e0d18', border: '3px solid #f4ecdc', borderRadius: 6,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)', fontFamily: 'JetBrains Mono, monospace',
        color: '#f4ecdc',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #2b2a36', fontFamily: 'Press Start 2P, monospace', fontSize: 11, letterSpacing: '0.15em', color: '#ff3c25' }}>
          ▸ MAIN MENU
        </div>
        <div>
          {items.map((it, i) => (
            <button
              key={it.id}
              onClick={() => {
                if (it.kind === 'jump') onJump(it.id);
                else if (it.kind === 'read') onReadMode();
                else if (it.kind === 'reset') onReset();
                else if (it.kind === 'title') onTitle();
                else onClose();
              }}
              onMouseEnter={() => setSel(i)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 18px',
                background: i === sel ? '#1a1620' : 'transparent',
                borderLeft: i === sel ? '3px solid #ff3c25' : '3px solid transparent',
                color: '#f4ecdc',
                cursor: 'pointer',
                borderTop: 'none', borderRight: 'none', borderBottom: 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13 }}>
                  {i === sel && <span style={{ color: '#ff3c25', marginRight: 8 }}>▶</span>}
                  {it.label}
                </span>
                {it.visited && <span style={{ color: '#6cf4d2', fontSize: 10 }}>✓ visited</span>}
              </div>
              {it.sub && <div style={{ fontSize: 10, color: '#8a8377', marginTop: 2, marginLeft: 18 }}>{it.sub}</div>}
            </button>
          ))}
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid #2b2a36', fontSize: 9, color: '#8a8377', letterSpacing: '0.15em' }}>
          ↑↓ NAVIGATE  ·  SPACE SELECT  ·  ESC CLOSE
        </div>
      </div>
    </div>
  );
}
