'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import s from './styles.module.css';
import {
  PROJECTS,
  CATEGORY_LABELS,
  CONTACT,
  type Project,
  type Category,
} from '@/lib/projects';
import ProjectCard from './ProjectCard';
import DemoModal, { type DemoKind } from './DemoModal';

const FILTERS: { key: 'all' | Category; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'overlay', label: 'FIRE · OVERLAYS' },
  { key: 'systems', label: 'WATER · SYSTEMS' },
  { key: 'ai', label: 'PSYCHIC · AI' },
  { key: 'web', label: 'ELECTRIC · WEB' },
  { key: 'rom', label: 'GROUND · ROM' },
  { key: 'tools', label: 'GRASS · TOOLS' },
];

const SKILL_BADGES: { label: string; count: string; color: string }[] = [
  { label: 'REACT', count: '×9', color: '#ee1515' },
  { label: 'TS', count: '×9', color: '#3b4cca' },
  { label: 'NODE', count: '×7', color: '#22c55e' },
  { label: 'C#', count: '×3', color: '#a855f7' },
  { label: 'RUST', count: '×2', color: '#f59e0b' },
  { label: 'NEXT', count: '×4', color: '#06b6d4' },
  { label: 'FFMPEG', count: '×3', color: '#ec4899' },
  { label: 'ELECTRON', count: '×4', color: '#84cc16' },
];

export default function Binder() {
  const [filter, setFilter] = useState<'all' | Category>('all');
  const [modal, setModal] = useState<{ kind: DemoKind; project: Project } | null>(null);

  // Inject Google Fonts via <link> rather than next/font so the static
  // export doesn't pin a build-time font download.
  useEffect(() => {
    const ids = ['v3-fonts-pre1', 'v3-fonts-pre2', 'v3-fonts'];
    const tags: HTMLElement[] = [];
    const add = (id: string, rel: string, href: string, crossOrigin?: string) => {
      if (document.getElementById(id)) return;
      const l = document.createElement('link');
      l.id = id;
      l.rel = rel;
      l.href = href;
      if (crossOrigin) l.crossOrigin = crossOrigin;
      document.head.appendChild(l);
      tags.push(l);
    };
    add(ids[0], 'preconnect', 'https://fonts.googleapis.com');
    add(ids[1], 'preconnect', 'https://fonts.gstatic.com', 'anonymous');
    add(
      ids[2],
      'stylesheet',
      'https://fonts.googleapis.com/css2?family=Bungee&family=Inter:wght@400;500;700&family=Press+Start+2P&display=swap',
    );
    return () => {
      tags.forEach((t) => t.remove());
    };
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)),
    [filter],
  );

  const totalCount = PROJECTS.length;
  const holoCount = PROJECTS.filter((p) => p.featured).length;
  const typeCount = new Set(PROJECTS.map((p) => p.category)).size;

  return (
    <div className={s.root}>
      <Link href="/" className={s.allLink}>
        ↩ all versions
      </Link>

      <div className={s.container}>
        <div className={s.binderTop}>
          <div className={s.logo}>
            <span>TEO</span> · PORTFOLIO BINDER
          </div>
          <div className={s.binderMeta}>
            SET — RUN {String(totalCount).padStart(2, '0')}
            <br />
            TRAINER ID #2026·05
          </div>
        </div>
        <div className={s.rings}>
          <span className={s.ring} />
          <span className={s.ring} />
          <span className={s.ring} />
        </div>

        <div className={s.page}>
          {/* TRAINER CARD */}
          <div className={s.trainerCard}>
            <div>
              <h1 className={s.trainerName}>{CONTACT.name.toUpperCase()}</h1>
              <div className={s.trainerId}>TRAINER ID · 2026·05 · OPEN TO WORK</div>
              <p className={s.trainerSub}>FRONTEND ENGINEER · POLYGLOT · SPEEDRUNNER</p>
              <p className={s.trainerBio}>
                A frontend engineer who builds the rare kind of UI: real-time, data-heavy, and
                tied to a system underneath that you can actually feel. Speedrun overlays,
                emulator memory hooks, AI video pipelines, solvers, websites.{' '}
                {totalCount} shipped repos. Flip any card to play.
              </p>
            </div>
            <div className={s.badges}>
              {SKILL_BADGES.map((b) => (
                <div
                  key={b.label}
                  className={s.badge}
                  style={{ ['--bc' as string]: b.color }}
                >
                  {b.label}
                  <small>{b.count}</small>
                </div>
              ))}
            </div>
          </div>

          {/* SHELF LABEL */}
          <div className={s.shelfLabel}>
            <h2>★ FEATURED CARDS · SET 01</h2>
            <span>click any card to flip · then OPEN to play</span>
          </div>

          {/* FILTERS */}
          <div className={s.filterbar}>
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

          {/* COLLECTION STATS */}
          <div className={s.stats}>
            <span>
              <b>
                {filtered.length}/{totalCount}
              </b>{' '}
              collected
            </span>
            <span>
              <b>{typeCount}</b> types
            </span>
            <span>
              <b>{holoCount}</b> holo rare
            </span>
            <span>
              <b>{PROJECTS.filter((p) => p.status === 'shipped').length}</b> shipped
            </span>
            <span>
              <b>{PROJECTS.filter((p) => p.status === 'active').length}</b> in training
            </span>
          </div>

          {/* GRID */}
          <div className={s.cards}>
            {filtered.map((p, i) => (
              <ProjectCard
                key={p.name + i}
                project={p}
                index={PROJECTS.indexOf(p)}
                total={totalCount}
                onOpen={(kind) => setModal({ kind, project: p })}
              />
            ))}
          </div>

          {/* CONTACT */}
          <div className={s.contact}>
            <div>★ CHALLENGE THE GYM LEADER</div>
            <div className={s.links}>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              <a href={CONTACT.github} target="_blank" rel="noopener noreferrer">
                github.com/teoperalez
              </a>
              <a href={CONTACT.site} target="_blank" rel="noopener noreferrer">
                teoperalez.com
              </a>
            </div>
          </div>
        </div>

        <div className={s.footer}>
          © 2026 · Pokémon, the binder aesthetic, and the typeface choices are an homage —
          not an affiliation. All code is mine. · <Link href="/">↩ all versions</Link>
        </div>
      </div>

      {modal && (
        <DemoModal
          kind={modal.kind}
          project={modal.project}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
