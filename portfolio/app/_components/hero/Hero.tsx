'use client';

import { useEffect, useState } from 'react';
import HeroField from './HeroField';
import s from './Hero.module.css';
import { PROJECTS } from '@/lib/projects';

const ROLES = [
  'real-time interfaces',
  'live emulator state',
  'ai video pipelines',
  'monte-carlo solvers',
  '600 hz polling',
  'frame-perfect overlays',
];

export default function Hero() {
  const [roleIdx, setRoleIdx] = useState(0);
  const [now, setNow] = useState<string>('--:--:--');

  useEffect(() => {
    const i = setInterval(() => setRoleIdx((r) => (r + 1) % ROLES.length), 2400);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    setNow(fmt());
    const i = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(i);
  }, []);

  const shippedCount = PROJECTS.filter((p) => p.status === 'shipped').length;
  const activeCount = PROJECTS.filter((p) => p.status === 'active').length;

  return (
    <section className={s.hero}>
      <div className={s.fieldWrap}>
        <HeroField />
      </div>
      <div className={s.scrim} aria-hidden />
      <div className={s.grain} aria-hidden />

      <header className={s.bar}>
        <div className={s.left}>
          <span className={s.pulse} />
          <span>live · {now} utc</span>
        </div>
        <div className={s.right}>
          <a href="#work">work</a>
          <a href="#lab">lab</a>
          <a href="#shelf">shelf</a>
          <a href="#essays">essays</a>
          <a href="#contact">contact</a>
        </div>
      </header>

      <div className={s.center}>
        <p className={s.kicker}>portfolio · 2026 edition</p>
        <h1 className={s.name}>
          Teo<br />
          <span className={s.italic}>Peralez</span>
        </h1>
        <p className={s.subline}>
          Frontend engineer who builds&nbsp;
          <em className={s.swap}>
            {ROLES.map((r, i) => (
              <span key={r} className={i === roleIdx ? 'is-active' : ''}>
                {r}
              </span>
            ))}
          </em>
          &nbsp;for the kind of product where the data on screen actually matters.
        </p>
      </div>

      <div className={s.live}>
        <div className={s.tickers}>
          <div className={s.ticker}>
            <span className={s.num}><b>{PROJECTS.length}</b></span>
            <span className={s.lbl}>repos public</span>
          </div>
          <div className={s.ticker}>
            <span className={s.num}><b>{shippedCount}</b></span>
            <span className={s.lbl}>shipped</span>
          </div>
          <div className={s.ticker}>
            <span className={s.num}><b>{activeCount}</b></span>
            <span className={s.lbl}>in flight</span>
          </div>
          <div className={s.ticker}>
            <span className={s.num}><b>600</b><span style={{ fontSize: '0.55em', marginLeft: 4 }}>Hz</span></span>
            <span className={s.lbl}>peak poll rate</span>
          </div>
        </div>
        <div className={s.hint} aria-hidden>
          <span>scroll</span>
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 16.5 5.5 10l1.4-1.4L12 13.7l5.1-5.1 1.4 1.4z"/></svg>
        </div>
      </div>
    </section>
  );
}
