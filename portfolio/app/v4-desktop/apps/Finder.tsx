'use client';

import { useState } from 'react';
import s from '../styles.module.css';
import { CATEGORY_LABELS, PROJECTS, type Category, type Project } from '@/lib/projects';

export const CAT_COLORS: Record<Category, string> = {
  overlay: '#fb7185',
  systems: '#22d3ee',
  ai: '#a78bfa',
  web: '#f472b6',
  rom: '#fb923c',
  tools: '#4ade80',
};

const CATS = Object.keys(CATEGORY_LABELS) as Category[];

const ghUrl = (p: Project) => `https://github.com/teoperalez/${encodeURIComponent(p.slug)}`;

export default function Finder() {
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [sel, setSel] = useState<Project | null>(null);

  const list = PROJECTS.filter((p) => filter === 'all' || p.category === filter);

  return (
    <div className={s.finderSplit}>
      <aside className={s.finderSide}>
        <h5 className={s.sideHead}>Favorites</h5>
        <div
          className={`${s.sbItem} ${filter === 'all' ? s.sbActive : ''}`}
          onClick={() => setFilter('all')}
        >
          <span className={s.sbDot} style={{ background: 'var(--cyan)' }} />
          All
          <span className={s.sbCount}>{PROJECTS.length}</span>
        </div>
        {CATS.map((c) => (
          <div
            key={c}
            className={`${s.sbItem} ${filter === c ? s.sbActive : ''}`}
            onClick={() => setFilter(c)}
          >
            <span className={s.sbDot} style={{ background: CAT_COLORS[c] }} />
            {CATEGORY_LABELS[c]}
            <span className={s.sbCount}>{PROJECTS.filter((p) => p.category === c).length}</span>
          </div>
        ))}
        <h5 className={s.sideHead} style={{ marginTop: 18 }}>
          Tags
        </h5>
        <div className={s.sbItem}>🟢 GitHub Actions</div>
        <div className={s.sbItem}>⚡ Electron</div>
        <div className={s.sbItem}>🦀 Rust</div>
        <div className={s.sbItem}>📦 .NET 8</div>
      </aside>

      <main className={s.finderMain}>
        {list.map((p) => (
          <div
            key={p.name}
            className={`${s.finderRow} ${sel?.name === p.name ? s.rowSel : ''}`}
            onClick={() => setSel(p)}
            onDoubleClick={() => window.open(ghUrl(p), '_blank', 'noopener')}
          >
            <span className={s.rowEm}>{p.glyph}</span>
            <span>
              <span className={s.rowNm}>{p.name}</span>
              <br />
              <span className={s.rowTg}>{p.tagline}</span>
            </span>
            <span className={s.rowSz}>{p.status}</span>
            <span className={s.rowTg}>
              <span className={s.pip} style={{ background: CAT_COLORS[p.category] }} />
              {p.category}
            </span>
          </div>
        ))}
      </main>

      {sel && (
        <aside className={s.preview}>
          <button type="button" className={s.prevClose} aria-label="Close preview" onClick={() => setSel(null)}>
            ✕
          </button>
          <div className={s.prevGlyph}>{sel.glyph}</div>
          <div className={s.prevName}>{sel.name}</div>
          <div className={s.prevTag}>{sel.tagline}</div>

          <h5 className={s.prevHead}>Story</h5>
          <p className={s.prevStory}>{sel.story}</p>

          <h5 className={s.prevHead}>Highlights</h5>
          <ul className={s.prevList}>
            {sel.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>

          <h5 className={s.prevHead}>Stack</h5>
          <div className={s.chips}>
            {sel.stack.map((t) => (
              <span key={t} className={s.chip}>
                {t}
              </span>
            ))}
          </div>

          <a className={s.ghBtn} href={ghUrl(sel)} target="_blank" rel="noopener noreferrer">
            Open in GitHub ↗
          </a>
        </aside>
      )}
    </div>
  );
}
