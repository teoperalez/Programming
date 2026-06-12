'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { CONTACT } from '@/lib/projects';

const VERSIONS = [
  {
    href: '/v1-terminal',
    num: 'v1 · brutalist',
    title: 'terminal',
    hover: '#f5d300',
    desc: 'Yellow-on-black CRT shell. Type commands into a working REPL, get project dossiers back.',
    demos: 'REPL · Gen 2 damage calc · Monte-Carlo poker · 600 Hz memory tap · pipeline trace',
    swatches: ['#000', '#f5d300', '#16a34a', '#fff'],
  },
  {
    href: '/v2-editorial',
    num: 'v2 · editorial',
    title: 'magazine',
    hover: '#b9351a',
    desc: 'Cream paper, serif headlines, drop caps. Projects as dispatches; war stories as columns.',
    demos: 'damage "specimen" infographic · case-study columns · annotated SVG architecture',
    swatches: ['#f3ecdf', '#1b1b1b', '#b9351a', '#6b6b6b'],
  },
  {
    href: '/v3-tradingcard',
    num: 'v3 · holo',
    title: 'trading cards',
    hover: '#ffcb05',
    desc: 'Pokémon-style binder. Every repo is a card with HP, attacks, holo shimmer. Flip to play.',
    demos: 'card flip demos · damage calc · equity · memory grid · EXP curves · pipeline',
    swatches: ['#0c5cc5', '#ffcb05', '#ee1515', '#3b4cca'],
  },
  {
    href: '/v4-desktop',
    num: 'v4 · spatial',
    title: 'desktop OS',
    hover: '#22d3ee',
    desc: 'macOS-style desktop: draggable windows, dock, glass. Finder, Terminal, Damage Lab, Activity Monitor.',
    demos: 'window manager · zsh terminal · live sparklines · finder with 26 repos',
    swatches: ['#0f172a', '#22d3ee', '#a78bfa', '#f472b6'],
  },
];

export default function Home() {
  const router = useRouter();

  // 1-4 keyboard shortcuts jump straight into a version
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < VERSIONS.length) router.push(VERSIONS[idx].href);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  return (
    <main className={styles.wrap}>
      <div className={styles.inner}>
        <h1 className={styles.title}>
          four portfolios.
          <br />
          <em>same engineer, different rooms.</em>
        </h1>
        <p className={styles.sub}>
          Four completely separate builds — no shared styles, no shared layouts — each pitching the
          same 26 repos through a different lens. Every version embeds live demos running the real
          algorithms: the Gen 2 damage formula, a 7-card poker evaluator, a simulated 600 Hz memory
          poller, the 12-step Hyperframes pipeline.
        </p>
        <p className={styles.hint}>
          press <kbd>1</kbd>–<kbd>4</kbd> to jump in
        </p>

        <div className={styles.grid}>
          {VERSIONS.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              className={styles.card}
              style={{ ['--hover' as string]: v.hover }}
            >
              <div className={styles.num}>{v.num}</div>
              <div className={styles.cardTitle}>{v.title}</div>
              <p className={styles.desc}>{v.desc}</p>
              <p className={styles.demos}>
                <b>inside:</b> {v.demos}
              </p>
              <div className={styles.swatch}>
                {v.swatches.map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </div>
            </Link>
          ))}
        </div>

        <footer className={styles.footer}>
          built by {CONTACT.name} · <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> ·{' '}
          <a href={CONTACT.github}>github.com/teoperalez</a>
        </footer>
      </div>
    </main>
  );
}
