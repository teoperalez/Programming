'use client';

import { useRef, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { PROJECTS, FEATURED, CONTACT, type Category, type Project } from '@/lib/projects';
import styles from './styles.module.css';
import DamageDemo from './DamageDemo';
import PokerDemo from './PokerDemo';
import MemoryDemo from './MemoryDemo';
import PipelineTrace from './PipelineTrace';
import Repl, { WARSTORIES } from './Repl';

const BANNER = [
  '████████╗███████╗ ██████╗     ██████╗ ███████╗██████╗  █████╗ ██╗     ███████╗███████╗',
  '╚══██╔══╝██╔════╝██╔═══██╗    ██╔══██╗██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝╚══███╔╝',
  '   ██║   █████╗  ██║   ██║    ██████╔╝█████╗  ██████╔╝███████║██║     █████╗    ███╔╝ ',
  '   ██║   ██╔══╝  ██║   ██║    ██╔═══╝ ██╔══╝  ██╔══██╗██╔══██║██║     ██╔══╝   ███╔╝  ',
  '   ██║   ███████╗╚██████╔╝    ██║     ███████╗██║  ██║██║  ██║███████╗███████╗███████╗',
  '   ╚═╝   ╚══════╝ ╚═════╝     ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝',
].join('\n');

const TAG_CLASS: Record<Category, string> = {
  overlay: styles.tOverlay,
  systems: styles.tSystems,
  ai: styles.tAi,
  web: styles.tWeb,
  rom: styles.tRom,
  tools: styles.tTools,
};

/** Anchor of the in-page demo a project maps to, if it has one. */
const DEMO_ANCHOR: Partial<Record<NonNullable<Project['demo']>, string>> = {
  damage: '#run-damage',
  poker: '#run-poker',
  memory: '#run-mem',
  pipeline: '#run-flow',
};

const PERMS: Record<Project['status'], string> = {
  shipped: 'drwxr-xr-x',
  active: 'drwxrwxr-x',
  planned: 'drwx------',
};

const SKILLS: Array<[string, number]> = [
  ['react / ts', 96],
  ['next.js', 88],
  ['electron', 92],
  ['canvas / webgl', 82],
  ['c# / .net 8 / wpf', 80],
  ['node / express', 90],
  ['python', 78],
  ['rust', 55],
  ['ffmpeg / fcpxml', 86],
  ['gha / vercel ops', 88],
  ['gb / z80 asm', 50],
];

/** Honest byte count of the project's description, formatted ls-style. */
const sizeOf = (p: Project) =>
  `${((p.story.length + p.highlights.join('').length) / 1024).toFixed(1)}K`;

function Tag({ category }: { category: Category }) {
  return <span className={`${styles.tag} ${TAG_CLASS[category]}`}>{category}</span>;
}

function Cmd({ children }: { children: ReactNode }) {
  return <span className={`${styles.line} ${styles.cmd}`}>{children}</span>;
}

function Out({ children }: { children: ReactNode }) {
  return <span className={`${styles.line} ${styles.out}`}>{children}</span>;
}

function ProjectName({ p }: { p: Project }) {
  const anchor = p.demo ? DEMO_ANCHOR[p.demo] : undefined;
  return anchor ? <a href={anchor}>{p.name}/</a> : <>{p.name}/</>;
}

export default function Terminal() {
  const replInputRef = useRef<HTMLInputElement>(null);

  // Faithful to the original: clicking anywhere non-interactive focuses the REPL.
  const onSurfaceClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, select, label')) return;
    if (window.getSelection()?.toString()) return;
    replInputRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className={styles.tty} onClick={onSurfaceClick}>
      {/* Runtime font load — deliberately not next/font (static export, no build-time fetch). */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap"
      />
      <div className={styles.crt} />
      <div className={styles.vignette} />

      <div className={styles.frame}>
        <div className={styles.backRow}>
          <Link href="/" className={styles.backlink}>
            ↩ all versions
          </Link>
        </div>

        <div className={styles.titlebar}>
          <div className={styles.lhs}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotAmb}`} />
            <span className={`${styles.dot} ${styles.dotGrn}`} />
          </div>
          <div className={styles.path}>teoperalez@portfolio: ~/work — 80×24</div>
          <div className={styles.tmux}>tmux 0:zsh</div>
        </div>

        <div className={styles.screen}>
          <pre className={styles.ascii}>{BANNER}</pre>

          <p className={styles.subline}>
            {'// frontend engineer · speedrun overlays · emulator hooks · ai video pipelines · solvers · web'}
            <br />
            {`// last login: today · ${PROJECTS.length} repos online · ready for input`}
          </p>

          <Cmd>whoami</Cmd>
          <Out>teo peralez — i build interfaces for systems that move data really fast.</Out>
          <Out>overlays that read live emulator memory at 600 Hz. video pipelines that</Out>
          <Out>stitch 12 stages of LLMs into a FCPXML. solvers, rom hacks, scrapers.</Out>
          <Out>i ship the whole stack and i ship the pixels on top.</Out>

          <hr className={styles.sep} />

          <Cmd>cat looking-for.txt</Cmd>
          <div className={styles.box}>
            <span className={`${styles.line} ${styles.h}`}>
              → frontend role, ideally somewhere with a hot loop.
            </span>
            <Out>live data. real-time visualization. dashboards that aren&apos;t just CRUD.</Out>
            <Out>remote-friendly. happy on any framework — react, next, electron, vanilla.</Out>
            <Out>bonus points if you let me poke at the backend too.</Out>
          </div>

          <hr className={styles.sep} />

          <Cmd>ls -la ~/work/featured/</Cmd>
          <table className={styles.t}>
            <thead>
              <tr>
                <th>permissions</th>
                <th>size</th>
                <th>name</th>
                <th>tag</th>
                <th>summary</th>
              </tr>
            </thead>
            <tbody>
              {FEATURED.map((p) => (
                <tr key={p.name}>
                  <td>{PERMS[p.status]}</td>
                  <td>{sizeOf(p)}</td>
                  <td className={styles.linkCell}>
                    <ProjectName p={p} />
                  </td>
                  <td>
                    <Tag category={p.category} />
                  </td>
                  <td>{p.tagline}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Cmd>ls -la ~/work/everything/</Cmd>
          <table className={styles.t}>
            <tbody>
              {PROJECTS.map((p) => (
                <tr key={p.name}>
                  <td>{PERMS[p.status]}</td>
                  <td className={styles.linkCell}>
                    <ProjectName p={p} />
                  </td>
                  <td>
                    <Tag category={p.category} />
                  </td>
                  <td>{p.tagline}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className={styles.muted}>
                  {PROJECTS.length} entries · every row is a real repo — `cat &lt;name&gt;` in the
                  repl below for the full story.
                </td>
              </tr>
            </tbody>
          </table>

          <hr className={styles.sep} />

          <Cmd>cat ~/.skills</Cmd>
          <div className={styles.box}>
            <pre className={styles.skillsPre}>
              {SKILLS.map(([label, pct]) => {
                const filled = Math.min(20, Math.round(pct / 5));
                return (
                  <span key={label}>
                    {label.padEnd(18)}
                    <span className={styles.barFilled}>{'█'.repeat(filled)}</span>
                    <span className={styles.barEmpty}>{'█'.repeat(20 - filled)}</span>
                    {`  ${pct}%`}
                    {'\n'}
                  </span>
                );
              })}
            </pre>
          </div>

          <hr className={styles.sep} />

          <span id="run-damage" />
          <Cmd>./demo damage --gen 2 --interactive</Cmd>
          <div className={styles.box}>
            <h3 className={styles.boxTitle}>
              damage_calc.exe <span className={styles.boxMeta}>from GSCNewLayout</span>
            </h3>
            <DamageDemo />
          </div>

          <span id="run-poker" />
          <Cmd>./demo equity --hands 2 --monte-carlo</Cmd>
          <div className={styles.box}>
            <h3 className={styles.boxTitle}>
              poker_equity.exe <span className={styles.boxMeta}>from PokerSolver</span>
            </h3>
            <PokerDemo />
          </div>

          <span id="run-mem" />
          <Cmd>./demo gamehook --poll-rate 600hz --tap</Cmd>
          <div className={styles.box}>
            <h3 className={styles.boxTitle}>
              gamehook_poll.exe <span className={styles.boxMeta}>from RBY-GameHook</span>
            </h3>
            <MemoryDemo />
          </div>

          <span id="run-flow" />
          <Cmd>./demo pipeline --steps 12</Cmd>
          <div className={styles.box}>
            <h3 className={styles.boxTitle}>
              hyperframes_pipeline.txt <span className={styles.boxMeta}>from IRLPC Hyperframes</span>
            </h3>
            <PipelineTrace />
          </div>

          <hr className={styles.sep} />

          <Cmd>cat warstories.log</Cmd>
          <div className={styles.box}>
            {WARSTORIES.map((w, i) => (
              <div key={w.title} style={i > 0 ? { marginTop: 14 } : undefined}>
                <span className={`${styles.line} ${styles.h}`}>── {w.title} ──</span>
                {w.lines.map((l) => (
                  <Out key={l}>{l}</Out>
                ))}
                <span className={`${styles.line} ${styles.ok}`}>{w.fix}</span>
              </div>
            ))}
          </div>

          <hr className={styles.sep} />

          <Cmd>help</Cmd>
          <Repl inputRef={replInputRef} />

          <hr className={styles.sep} />

          <Cmd>cat contact.vcf</Cmd>
          <div className={styles.box}>
            <Out>name : {CONTACT.name.toLowerCase()}</Out>
            <Out>role : {CONTACT.role.toLowerCase()}</Out>
            <Out>
              mail : <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </Out>
            <Out>
              gh   : <a href={CONTACT.github}>{CONTACT.github.replace('https://', '')}</a>
            </Out>
            <Out>
              site : <a href={CONTACT.site}>{CONTACT.site.replace('https://', '')}</a>
            </Out>
          </div>

          <span className={`${styles.line} ${styles.cmd} ${styles.cursor}`}>_</span>
        </div>

        <div className={styles.backRow}>
          <Link href="/" className={styles.backlink}>
            ↩ all versions
          </Link>
        </div>
      </div>
    </div>
  );
}
