'use client';

import { useState, type CSSProperties } from 'react';
import s from './styles.module.css';
import type { Project, Category } from '@/lib/projects';
import type { DemoKind } from './DemoModal';

interface Props {
  project: Project;
  index: number;
  total: number;
  onOpen: (kind: DemoKind) => void;
}

const TYPE_CLASS: Record<Category, string> = {
  overlay: s.tOverlay,
  systems: s.tSystems,
  ai: s.tAi,
  web: s.tWeb,
  rom: s.tRom,
  tools: s.tTools,
};

/** Deterministic "stat roll" from a project name so HP/level are stable. */
function statRoll(name: string, mod: number) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function deriveHp(project: Project): number {
  // featured cards trend higher; status modifies the base.
  const base = project.featured ? 160 : project.status === 'shipped' ? 110 : 90;
  return base + statRoll(project.name, 60);
}
function deriveLevel(project: Project): number {
  const base = project.featured ? 75 : 50;
  return base + statRoll(project.name + 'lv', 25);
}

/** Pick 2-3 attack rows from the project's real highlights. */
function deriveAttacks(project: Project): { name: string; dmg: string }[] {
  const highlights = project.highlights.slice(0, 3);
  return highlights.map((h, i) => {
    // shorten to ~3 words for the attack name.
    const cleaned = h
      .replace(/[—:].*/, '')
      .replace(/\(.*?\)/g, '')
      .trim();
    const words = cleaned.split(/\s+/).slice(0, 3).join(' ');
    const dmg = 30 + statRoll(project.name + i, 130);
    return { name: words.length > 24 ? words.slice(0, 22) + '…' : words, dmg: String(dmg) };
  });
}

const EVOLUTIONS: Record<string, { kind: 'from' | 'into'; partner: string }> = {
  RBYNewLayout: { kind: 'into', partner: 'RBYNewLayout-components' },
  'RBYNewLayout-components': { kind: 'from', partner: 'RBYNewLayout' },
};

export default function ProjectCard({ project, index, total, onOpen }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [holo, setHolo] = useState({ x: '50%', y: '50%' });

  const hp = deriveHp(project);
  const level = deriveLevel(project);
  const attacks = deriveAttacks(project);
  const stackBadges = project.stack.slice(0, 2);
  const evo = EVOLUTIONS[project.name];

  const cardClasses = [s.card, TYPE_CLASS[project.category]];
  if (flipped) cardClasses.push(s.flipped);
  if (project.featured) cardClasses.push(s.holo);

  const onMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHolo({
      x: `${((e.clientX - r.left) / r.width) * 100}%`,
      y: `${((e.clientY - r.top) / r.height) * 100}%`,
    });
  };

  const cardStyle: CSSProperties = {
    ['--hx' as string]: holo.x,
    ['--hy' as string]: holo.y,
  };

  return (
    <div
      className={cardClasses.join(' ')}
      onMouseMove={onMove}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
      style={cardStyle}
    >
      {project.featured && <div className={s.rarity}>★ HOLO RARE</div>}
      {project.status === 'active' && <div className={s.ribbon}>IN TRAINING</div>}

      <div className={s.inner}>
        {/* FRONT */}
        <div className={s.face}>
          <div className={s.cTop}>
            <span className={s.cName}>{project.name.toUpperCase()}</span>
            <span className={s.cHp}>
              HP <b>{hp}</b>
            </span>
          </div>
          <div className={s.cArt}>
            <span className={s.glyph}>{project.glyph}</span>
            <span className={s.lvl}>Lv. {level}</span>
            <span className={s.typeBadges}>
              {stackBadges.map((t) => (
                <span key={t} className={s.typeBadge}>
                  {t}
                </span>
              ))}
            </span>
          </div>
          <div className={s.attacks}>
            {attacks.map((a) => (
              <div key={a.name} className={s.atk}>
                <span className={s.atkName}>{a.name}</span>
                <span className={s.atkDmg}>{a.dmg}</span>
              </div>
            ))}
          </div>
          {evo && (
            <div className={s.evo}>
              EVOLVES {evo.kind === 'from' ? 'FROM' : 'INTO'} → {evo.partner}
            </div>
          )}
          <div className={s.cFoot}>
            <span>
              #{String(index + 1).padStart(3, '0')} / {String(total).padStart(3, '0')}
            </span>
            <span>★ teoperalez</span>
          </div>
          <div className={s.holoOverlay} />
        </div>

        {/* BACK */}
        <div className={`${s.face} ${s.back}`}>
          <h4>{project.name}</h4>
          <p className={s.tag}>{project.tagline}</p>
          <ul>
            {project.highlights.slice(0, 2).map((h, i) => (
              <li key={i}>{h.length > 110 ? h.slice(0, 108) + '…' : h}</li>
            ))}
          </ul>
          <button
            className={s.openBtn}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(project.demo ?? 'about');
            }}
          >
            ▶ open
          </button>
        </div>
      </div>
    </div>
  );
}
