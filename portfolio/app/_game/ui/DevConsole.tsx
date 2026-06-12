'use client';

import type { GameMetrics } from '../engine/types';

interface Props { metrics: GameMetrics; onClose: () => void; }

/** The engineer's wink. Backtick toggles it. */
export default function DevConsole({ metrics, onClose }: Props) {
  const fpsColor = metrics.fps >= 58 ? '#6cf4d2' : metrics.fps >= 30 ? '#ffb800' : '#ff3c25';
  return (
    <div style={{
      position: 'fixed', top: 70, left: 12, zIndex: 30,
      padding: '12px 16px', background: 'rgba(7,7,11,0.92)',
      backdropFilter: 'blur(6px)', border: '1px solid #ff3c25',
      borderRadius: 6, fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11, color: '#f4ecdc', letterSpacing: '0.05em',
      lineHeight: 1.7, minWidth: 220, boxShadow: '0 12px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #2b2a36' }}>
        <span style={{ color: '#ff3c25', fontWeight: 700, letterSpacing: '0.15em' }}>▸ DEV CONSOLE</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8a8377', cursor: 'pointer', fontSize: 14 }}>×</button>
      </div>
      <div>fps        <span style={{ color: fpsColor, marginLeft: 12 }}>{metrics.fps}</span></div>
      <div>draw ms    <span style={{ color: '#f4ecdc', marginLeft: 12 }}>{metrics.drawMs.toFixed(2)}</span></div>
      <div>entities   <span style={{ color: '#f4ecdc', marginLeft: 12 }}>{metrics.entities}</span></div>
      <div>vis tiles  <span style={{ color: '#f4ecdc', marginLeft: 12 }}>{metrics.visibleTiles}</span></div>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #2b2a36', color: '#8a8377', fontSize: 10 }}>
        the source for this game lives at<br/>
        <a href="https://github.com/teoperalez/Programming/tree/main/portfolio/app/_game" target="_blank" rel="noopener" style={{ color: '#6cf4d2' }}>
          portfolio/app/_game/
        </a>
      </div>
    </div>
  );
}
