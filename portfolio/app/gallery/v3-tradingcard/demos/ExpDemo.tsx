'use client';

import { useEffect, useRef, useState } from 'react';
import s from '../styles.module.css';

type Group = 'fast' | 'medium-fast' | 'medium-slow' | 'slow';

function expFor(group: Group, n: number): number {
  if (n < 1) return 0;
  if (group === 'fast') return Math.floor(0.8 * n ** 3);
  if (group === 'medium-fast') return n ** 3;
  if (group === 'medium-slow')
    return Math.max(0, Math.floor(1.2 * n ** 3 - 15 * n ** 2 + 100 * n - 140));
  return Math.floor(1.25 * n ** 3);
}

export default function ExpDemo() {
  const [group, setGroup] = useState<Group>('medium-fast');
  const [level, setLevel] = useState(50);
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = cv.clientWidth;
    const cssH = cv.clientHeight;
    cv.width = Math.max(1, cssW * dpr);
    cv.height = Math.max(1, cssH * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cssW, cssH);

    // grid
    ctx.strokeStyle = '#e6dec5';
    ctx.lineWidth = 1;
    for (let x = 0; x < cssW; x += cssW / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
      ctx.stroke();
    }
    for (let y = 0; y < cssH; y += cssH / 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
      ctx.stroke();
    }

    // curve
    const maxExp = expFor(group, 100);
    ctx.strokeStyle = '#ee1515';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let n = 1; n <= 100; n++) {
      const x = (n / 100) * cssW;
      const y = cssH - (expFor(group, n) / maxExp) * cssH * 0.95 - 2;
      n === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // marker
    const mx = (level / 100) * cssW;
    const my = cssH - (expFor(group, level) / maxExp) * cssH * 0.95 - 2;
    ctx.fillStyle = '#3b4cca';
    ctx.beginPath();
    ctx.arc(mx, my, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 11px Inter, sans-serif';
    const label = `L${level} · ${expFor(group, level).toLocaleString()} EXP`;
    const lx = mx + 10 + 120 > cssW ? mx - 124 : mx + 10;
    ctx.fillText(label, lx, my - 8);
  }, [group, level]);

  const next = expFor(group, level + 1) - expFor(group, level);

  return (
    <>
      <p
        style={{
          fontFamily: 'var(--pixel)',
          fontSize: '9px',
          color: '#6b6675',
          margin: '6px 0 10px',
        }}
      >
        ▼ EXP needed to reach a level · 4 growth groups
      </p>
      <canvas ref={cvRef} className={s.expCanvas} />
      <div className={s.expCtl}>
        <div>
          <label>Group</label>
          <select value={group} onChange={(e) => setGroup(e.target.value as Group)}>
            <option value="fast">fast</option>
            <option value="medium-fast">medium-fast</option>
            <option value="medium-slow">medium-slow</option>
            <option value="slow">slow</option>
          </select>
        </div>
        <div>
          <label>
            Level{' '}
            <span style={{ fontFamily: 'var(--pixel)', fontSize: '9px' }}>{level}</span>
          </label>
          <input
            type="range"
            min={2}
            max={100}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
        </div>
      </div>
      <div className={s.out}>
        GROUP ▸ {group}
        <br />
        LEVEL ▸ {level}
        <br />
        TOTAL EXP ▸ {expFor(group, level).toLocaleString()}
        <br />
        TO NEXT LV ▸ {next.toLocaleString()}
      </div>
    </>
  );
}
