'use client';

import { useEffect, useRef, useState } from 'react';
import s from '../styles.module.css';

const SPARK_COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#4ade80'];

const CARDS = [
  { key: 'hz', label: 'RBY-GameHook poll' },
  { key: 'diff', label: 'Memory diff/sec' },
  { key: 'queue', label: 'FCPXML build queue' },
  { key: 'ws', label: 'OBS WS clients' },
] as const;

interface Stats {
  hz: string;
  diff: string;
  queue: string;
  ws: string;
  cpu: string[];
}

const PROCS = [
  'RBYNewLayout.exe',
  'GameHook.WebAPI (~55 MB single-file)',
  'AhShuckie (rust)',
  'node (hyperframes)',
  'ffmpeg',
];

export default function Monitor() {
  const canvases = useRef<(HTMLCanvasElement | null)[]>([null, null, null, null]);
  const [stats, setStats] = useState<Stats>({
    hz: '600 Hz',
    diff: '— /s',
    queue: '0 jobs',
    ws: '3 clients',
    cpu: PROCS.map(() => '—%'),
  });

  useEffect(() => {
    const series = SPARK_COLORS.map(() => new Array<number>(40).fill(0));

    const tick = () => {
      canvases.current.forEach((cv, i) => {
        if (!cv) return;
        const w = cv.clientWidth || 200;
        if (cv.width !== w) cv.width = w;
        if (cv.height !== 36) cv.height = 36;
        const ctx = cv.getContext('2d');
        if (!ctx) return;

        const data = series[i];
        data.shift();
        data.push(0.2 + Math.random() * 0.8);

        ctx.clearRect(0, 0, cv.width, cv.height);
        const c = SPARK_COLORS[i];
        ctx.strokeStyle = c;
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((y, j) => {
          const x = (j / (data.length - 1)) * cv.width;
          const yy = cv.height - y * cv.height * 0.9 - 2;
          if (j === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        });
        ctx.stroke();
        ctx.fillStyle = c + '40';
        ctx.lineTo(cv.width, cv.height);
        ctx.lineTo(0, cv.height);
        ctx.closePath();
        ctx.fill();
      });

      setStats({
        hz: `${592 + Math.floor(Math.random() * 9)} Hz`,
        diff: `${180 + Math.floor(Math.random() * 200)} /s`,
        queue: `${Math.floor(Math.random() * 4)} jobs`,
        ws: `${2 + Math.floor(Math.random() * 4)} clients`,
        cpu: [
          (10 + Math.random() * 8).toFixed(1) + '%',
          (4 + Math.random() * 6).toFixed(1) + '%',
          (32 + Math.random() * 14).toFixed(1) + '%',
          (1 + Math.random() * 3).toFixed(1) + '%',
          (45 + Math.random() * 20).toFixed(1) + '%',
        ],
      });
    };

    tick();
    const iv = setInterval(tick, 900);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      <div className={s.amHead}>Live · sim · refresh 1 Hz</div>
      <div className={s.amGrid}>
        {CARDS.map((c, i) => (
          <div key={c.key} className={s.amCard}>
            <h5>{c.label}</h5>
            <div className={s.amV}>{stats[c.key]}</div>
            <canvas
              className={s.mini}
              ref={(el) => {
                canvases.current[i] = el;
              }}
            />
          </div>
        ))}
      </div>
      <div className={s.amList}>
        <div className={s.amRow}>
          <span>process</span>
          <span>cpu</span>
        </div>
        {PROCS.map((p, i) => (
          <div key={p} className={s.amRow}>
            <span>{p}</span>
            <span>{stats.cpu[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
