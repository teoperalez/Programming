'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import s from './styles.module.css';
import Readme from './apps/Readme';
import Finder from './apps/Finder';
import DamageLab from './apps/DamageLab';
import Term from './apps/Term';
import Monitor from './apps/Monitor';
import Mail from './apps/Mail';
import Github from './apps/Github';
import Pipeline from './apps/Pipeline';
import Notes from './apps/Notes';

export type AppKey =
  | 'readme'
  | 'finder'
  | 'lab'
  | 'terminal'
  | 'monitor'
  | 'mail'
  | 'github'
  | 'pipeline'
  | 'notes';

interface AppDef {
  title: string;
  appName: string;
  label: string;
  glyph: string;
  color: string;
  w: number;
  h: number;
  x: number;
  y: number;
}

const APPS: Record<AppKey, AppDef> = {
  readme: { title: 'about.md — TextEdit', appName: 'TextEdit', label: 'about.md', glyph: '📘', color: '#22d3ee', w: 580, h: 540, x: 80, y: 60 },
  finder: { title: '~/Programming — Finder', appName: 'Finder', label: 'Projects', glyph: '📂', color: '#a78bfa', w: 880, h: 500, x: 150, y: 100 },
  lab: { title: 'Damage Lab — Pokémon Gen 2', appName: 'Damage Lab', label: 'Damage Lab', glyph: '⚗️', color: '#f472b6', w: 460, h: 600, x: 340, y: 120 },
  terminal: { title: 'teo@portfolio: ~ — zsh', appName: 'Terminal', label: 'Terminal', glyph: '💻', color: '#4ade80', w: 620, h: 380, x: 140, y: 200 },
  monitor: { title: 'Activity Monitor', appName: 'Activity Monitor', label: 'Activity', glyph: '📊', color: '#fb923c', w: 500, h: 490, x: 420, y: 70 },
  pipeline: { title: 'Pipeline — IRLPC Hyperframes', appName: 'Pipeline', label: 'Pipeline', glyph: '🎬', color: '#6366f1', w: 520, h: 560, x: 380, y: 50 },
  notes: { title: 'Engineering Notes', appName: 'Notes', label: 'Notes', glyph: '📝', color: '#eab308', w: 680, h: 460, x: 220, y: 160 },
  mail: { title: 'Compose — teoperalez@gmail.com', appName: 'Mail', label: 'Mail', glyph: '✉️', color: '#f59e0b', w: 520, h: 430, x: 280, y: 140 },
  github: { title: 'github.com/teoperalez — Safari', appName: 'Safari', label: 'GitHub', glyph: '🐙', color: '#64748b', w: 640, h: 500, x: 240, y: 110 },
};

const ICON_ORDER: AppKey[] = ['readme', 'finder', 'lab', 'terminal', 'monitor', 'pipeline', 'notes'];
const DOCK_ORDER: AppKey[] = ['readme', 'finder', 'lab', 'terminal', 'monitor', 'pipeline', 'notes', 'mail', 'github'];

export interface WinState {
  id: number;
  app: AppKey;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  zoomed: boolean;
  /** saved rect for un-zooming */
  prev?: { x: number; y: number; w: number; h: number };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function Desktop() {
  const [wins, setWins] = useState<WinState[]>([]);
  const [clock, setClock] = useState('--:--');

  /* ---------- window manager actions ---------- */

  const openApp = useCallback((key: AppKey) => {
    setWins((prev) => {
      const top = prev.reduce((m, w) => Math.max(m, w.z), 10) + 1;
      if (prev.some((w) => w.app === key)) {
        return prev.map((w) => (w.app === key ? { ...w, minimized: false, z: top } : w));
      }
      const def = APPS[key];
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = Math.min(def.w, vw - 32);
      const h = Math.min(def.h, vh - 140);
      // stagger-cascade initial position, clamped to the viewport
      const x = clamp(def.x + prev.length * 30, 12, Math.max(12, vw - w - 20));
      const y = clamp(def.y + prev.length * 30, 8, Math.max(8, vh - h - 150));
      const id = prev.reduce((m, w2) => Math.max(m, w2.id), 0) + 1;
      return [...prev, { id, app: key, x, y, w, h, z: top, minimized: false, zoomed: false }];
    });
  }, []);

  const closeWin = useCallback((id: number) => {
    setWins((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWin = useCallback((id: number) => {
    setWins((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)));
  }, []);

  const zoomWin = useCallback((id: number) => {
    setWins((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (w.zoomed && w.prev) {
          return { ...w, zoomed: false, x: w.prev.x, y: w.prev.y, w: w.prev.w, h: w.prev.h, prev: undefined };
        }
        return {
          ...w,
          zoomed: true,
          prev: { x: w.x, y: w.y, w: w.w, h: w.h },
          x: 12,
          y: 8,
          w: window.innerWidth - 24,
          h: window.innerHeight - 28 - 80 - 16,
        };
      }),
    );
  }, []);

  const focusWin = useCallback((id: number) => {
    setWins((prev) => {
      const top = prev.reduce((m, w) => Math.max(m, w.z), 10);
      const target = prev.find((w) => w.id === id);
      if (!target || target.z === top) return prev;
      return prev.map((w) => (w.id === id ? { ...w, z: top + 1 } : w));
    });
  }, []);

  const moveWin = useCallback((id: number, x: number, y: number) => {
    setWins((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  /* ---------- menubar clock ---------- */

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
          ' ' +
          d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      );
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  /* ---------- boot sequence: stagger-open intro windows ---------- */

  useEffect(() => {
    const timers = [
      setTimeout(() => openApp('readme'), 250),
      setTimeout(() => openApp('finder'), 700),
      setTimeout(() => openApp('terminal'), 1100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [openApp]);

  /* ---------- derived state ---------- */

  const focused = wins.reduce<WinState | null>(
    (m, w) => (!w.minimized && (m === null || w.z > m.z) ? w : m),
    null,
  );
  const activeName = focused ? APPS[focused.app].appName : 'Finder';
  const openSet = new Set(wins.map((w) => w.app));

  return (
    <div className={s.root}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
      />
      <div className={s.dots} aria-hidden />

      {/* menu bar */}
      <div className={s.menubar}>
        <span className={s.apple}>●</span>
        <span className={s.appName}>{activeName}</span>
        {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((m) => (
          <span key={m} className={s.mItem}>
            {m}
          </span>
        ))}
        <div className={s.mRight}>
          <Link href="/gallery" className={s.backLink}>
            ↩ all versions
          </Link>
          <span>{clock}</span>
          <span>📶</span>
          <span>🔋 96%</span>
        </div>
      </div>

      {/* desktop: icons + windows */}
      <div className={s.desktop}>
        <div className={s.icons}>
          {ICON_ORDER.map((k) => (
            <div key={k} className={s.icon} role="button" tabIndex={0} onClick={() => openApp(k)} onKeyDown={(e) => e.key === 'Enter' && openApp(k)}>
              <div className={s.ig} style={{ '--igc': APPS[k].color } as CSSProperties}>
                {APPS[k].glyph}
              </div>
              <div className={s.il}>{APPS[k].label}</div>
            </div>
          ))}
        </div>

        {wins.map((win) => (
          <WindowFrame
            key={`${win.app}-${win.id}`}
            win={win}
            title={APPS[win.app].title}
            onFocus={focusWin}
            onClose={closeWin}
            onMin={minimizeWin}
            onZoom={zoomWin}
            onMove={moveWin}
          >
            <AppBody app={win.app} openApp={openApp} />
          </WindowFrame>
        ))}
      </div>

      {/* dock */}
      <nav className={s.dock} aria-label="Dock">
        {DOCK_ORDER.map((k) => (
          <button
            key={k}
            type="button"
            className={`${s.dockItem} ${openSet.has(k) ? s.hasOpen : ''}`}
            style={{ '--dc': APPS[k].color } as CSSProperties}
            onClick={() => openApp(k)}
          >
            {APPS[k].glyph}
            <span className={s.tt}>{APPS[k].label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ---------- per-app body ---------- */

function AppBody({ app, openApp }: { app: AppKey; openApp: (k: AppKey) => void }): ReactNode {
  switch (app) {
    case 'readme':
      return <Readme />;
    case 'finder':
      return <Finder />;
    case 'lab':
      return <DamageLab />;
    case 'terminal':
      return <Term openApp={openApp} />;
    case 'monitor':
      return <Monitor />;
    case 'mail':
      return <Mail />;
    case 'github':
      return <Github />;
    case 'pipeline':
      return <Pipeline />;
    case 'notes':
      return <Notes />;
  }
}

/* body classes for apps that restyle the window content area */
const BODY_CLASS: Partial<Record<AppKey, string>> = {
  finder: s.bodyFinder,
  terminal: s.bodyTerm,
  notes: s.bodyNotes,
};

/* ---------- draggable window frame ---------- */

interface FrameProps {
  win: WinState;
  title: string;
  onFocus: (id: number) => void;
  onClose: (id: number) => void;
  onMin: (id: number) => void;
  onZoom: (id: number) => void;
  onMove: (id: number, x: number, y: number) => void;
  children: ReactNode;
}

function WindowFrame({ win, title, onFocus, onClose, onMin, onZoom, onMove, children }: FrameProps) {
  // drag origin captured at pointerdown; null when not dragging
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  const onBarPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onFocus(win.id);
    drag.current = { px: e.clientX, py: e.clientY, ox: win.x, oy: win.y };
    // capture so pointermove/pointerup keep firing for mouse AND touch
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onBarPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const nx = clamp(drag.current.ox + e.clientX - drag.current.px, 0, window.innerWidth - 60);
    const ny = clamp(drag.current.oy + e.clientY - drag.current.py, 0, window.innerHeight - 140);
    onMove(win.id, nx, ny);
  };

  const onBarPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      className={`${s.win} ${win.minimized ? s.minimized : ''}`}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
      onPointerDown={() => onFocus(win.id)}
    >
      <div
        className={s.winBar}
        onPointerDown={onBarPointerDown}
        onPointerMove={onBarPointerMove}
        onPointerUp={onBarPointerUp}
        onPointerCancel={onBarPointerUp}
      >
        <div className={s.traffic}>
          <button type="button" className={s.tc} aria-label="Close" onClick={() => onClose(win.id)} />
          <button type="button" className={s.tm} aria-label="Minimize" onClick={() => onMin(win.id)} />
          <button type="button" className={s.tz} aria-label="Zoom" onClick={() => onZoom(win.id)} />
        </div>
        <div className={s.winTitle}>{title}</div>
        <div style={{ width: 54 }} />
      </div>
      <div className={`${s.winBody} ${BODY_CLASS[win.app] ?? ''}`}>{children}</div>
    </div>
  );
}
