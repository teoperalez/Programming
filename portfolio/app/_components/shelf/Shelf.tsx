'use client';

import { useState } from 'react';
import s from './Shelf.module.css';
import { PROJECTS, CATEGORY_LABELS, type Category } from '@/lib/projects';

const FILTERS: { key: 'all' | Category; label: string }[] = [
  { key: 'all', label: 'all' },
  { key: 'overlay', label: 'overlays' },
  { key: 'systems', label: 'systems' },
  { key: 'ai', label: 'ai' },
  { key: 'web', label: 'web' },
  { key: 'tools', label: 'tools' },
  { key: 'rom', label: 'rom' },
];

export default function Shelf() {
  const [filter, setFilter] = useState<'all' | Category>('all');
  const visible = filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === filter);

  return (
    <section className={s.section} id="shelf">
      <div className={s.head}>
        <div>
          <p className={s.kicker}>
            <span className={s.num}>04</span>
            the shelf
          </p>
          <h2 className={s.title}>
            every <em>shipped</em> repo, in one room.
          </h2>
        </div>
        <p className={s.subnote}>{PROJECTS.length} entries · filter below</p>
      </div>

      <div className={s.filter}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={filter === f.key ? s.active : ''}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={s.grid}>
        {visible.map((p) => (
          <a
            key={p.name}
            className={s.card}
            href={`https://github.com/teoperalez/${p.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={s.cardTop}>
              <span className={s.glyph}>{p.glyph}</span>
              <span className={`${s.status} ${s[p.status] ?? ''}`}>{p.status}</span>
            </div>
            <h3 className={s.cardName}>{p.name}</h3>
            <p className={s.cardTag}>{p.tagline}</p>
            <div className={s.cardMeta}>
              <span className={s.cat}>{CATEGORY_LABELS[p.category]}</span>
              <svg className={s.arrow} viewBox="0 0 24 24"><path fill="currentColor" d="M5 12h12l-4-4 1.4-1.4L20.8 12l-6.4 5.4L13 16l4-4H5z"/></svg>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
