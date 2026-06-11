'use client';

import s from '../styles.module.css';
import { CONTACT, FEATURED, PROJECTS, type Project } from '@/lib/projects';

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  'C#': '#178600',
  Rust: '#dea584',
  Python: '#3572A5',
  'Node.js': '#5fa04e',
  'Next.js': '#888888',
  Electron: '#47848f',
};

const LANG_PRIORITY = ['TypeScript', 'C#', 'Rust', 'Python', 'Node.js', 'Next.js', 'Electron'];

const langOf = (p: Project) => LANG_PRIORITY.find((l) => p.stack.includes(l)) ?? p.stack[0];

export default function Github() {
  return (
    <div className={s.ghList}>
      <div className={s.ghProfile}>
        <div className={s.ghAvatar}>T</div>
        <div className={s.ghWho}>
          <div className={s.ghHandle}>teoperalez</div>
          <div className={s.ghSub}>{PROJECTS.length} repos · joined 2018</div>
        </div>
        <a className={s.ghFollow} href={CONTACT.github} target="_blank" rel="noopener noreferrer">
          Follow
        </a>
      </div>

      {FEATURED.map((p) => {
        const lang = langOf(p);
        const color = LANG_COLORS[lang] ?? '#888888';
        return (
          <div key={p.name} className={s.ghRow}>
            <span className={s.pip} style={{ background: color }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div>
                <a
                  className={s.ghName}
                  href={`https://github.com/teoperalez/${encodeURIComponent(p.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.slug}
                </a>
              </div>
              <div className={s.ghDesc}>{p.tagline}</div>
              <div className={s.ghBar}>
                <span className={s.lang}>
                  <span className={s.pip} style={{ background: color }} />
                  {lang}
                </span>
                <span>{p.status}</span>
                <span>{p.stack.slice(0, 3).join(' · ')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
