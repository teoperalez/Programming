'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import s from '../styles.module.css';
import { CONTACT, PIPELINE_STEPS, PROJECTS } from '@/lib/projects';
import type { AppKey } from '../Desktop';

interface Line {
  id: number;
  node: ReactNode;
}

const OPEN_MAP: Record<string, AppKey> = {
  readme: 'readme',
  about: 'readme',
  projects: 'finder',
  finder: 'finder',
  files: 'finder',
  lab: 'lab',
  damage: 'lab',
  terminal: 'terminal',
  activity: 'monitor',
  monitor: 'monitor',
  mail: 'mail',
  github: 'github',
  pipeline: 'pipeline',
  hyperframes: 'pipeline',
  notes: 'notes',
};

const PORTS: ReadonlyArray<readonly [string, string]> = [
  ['localhost:8085', 'GameHook.WebAPI — emulator memory → overlays'],
  ['127.0.0.1:55356', 'AhShuckie UDP / shared memory (PokeAByte protocol)'],
  ['127.0.0.1:30158', 'AhShuckie REST — /stats /load-replay /go-to-frame'],
  ['localhost:5173', 'Hyperframes approval gate (React + Express)'],
];

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function Term({ openApp }: { openApp: (k: AppKey) => void }) {
  const idc = useRef(1);
  const [lines, setLines] = useState<Line[]>(() => [
    {
      id: 0,
      node: (
        <span className={s.outTxt}>
          teoOS 1.0 — Next.js build · type <span className={s.okTxt}>help</span> to start
        </span>
      ),
    },
  ]);
  const [val, setVal] = useState('');
  const hist = useRef<string[]>([]);
  const hidx = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [lines]);

  const print = (node: ReactNode) => {
    const id = idc.current++;
    setLines((ls) => [...ls, { id, node }]);
  };
  const out = (text: string) => print(<span className={s.outTxt}>{text}</span>);
  const ok = (text: string) => print(<span className={s.okTxt}>{text}</span>);
  const err = (text: string) => print(<span className={s.errTxt}>{text}</span>);

  const exec = (raw: string) => {
    print(
      <span>
        <span className={s.prompt}>teo@portfolio ~</span> <span className={s.okTxt}>$</span> {raw}
      </span>,
    );
    const [name, ...args] = raw.split(/\s+/);
    const cmd = name.toLowerCase();

    switch (cmd) {
      case 'help':
      case 'h':
      case '?':
        print(
          <span className={s.outTxt}>
            available: <span className={s.okTxt}>ls</span> · <span className={s.okTxt}>cat &lt;project&gt;</span> ·{' '}
            <span className={s.okTxt}>about</span> · <span className={s.okTxt}>stack</span> ·{' '}
            <span className={s.okTxt}>ports</span> · <span className={s.okTxt}>pipeline</span> ·{' '}
            <span className={s.okTxt}>open &lt;app&gt;</span> · <span className={s.okTxt}>contact</span> ·{' '}
            <span className={s.okTxt}>clear</span> — ↑/↓ for history
          </span>,
        );
        break;

      case 'ls':
        out(PROJECTS.map((p) => `${p.glyph} ${p.name}`).join('  '));
        break;

      case 'about':
        out(
          `${CONTACT.name} — ${CONTACT.role}. I build UIs for hot loops: live emulator state, solvers, AI pipelines, speedrun overlays. ${PROJECTS.length} public repos. polyglot.`,
        );
        break;

      case 'stack':
        out('react · typescript · electron · next · node · c# / .net 8 · rust · python · ffmpeg · fcpxml · canvas · webgl · gha · wpf · z80');
        break;

      case 'contact':
        print(
          <span className={s.outTxt}>
            mail:{' '}
            <a className={s.termLink} href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
            {'\n'}gh:{' '}
            <a className={s.termLink} href={CONTACT.github} target="_blank" rel="noopener noreferrer">
              github.com/teoperalez
            </a>
            {'\n'}web:{' '}
            <a className={s.termLink} href={CONTACT.site} target="_blank" rel="noopener noreferrer">
              teoperalez.com
            </a>
          </span>,
        );
        break;

      case 'ports':
        PORTS.forEach(([port, what]) =>
          print(
            <span className={s.outTxt}>
              <span className={s.okTxt}>{port.padEnd(18)}</span>
              {what}
            </span>,
          ),
        );
        break;

      case 'pipeline':
        out('IRLPC Hyperframes — 12 steps, raw footage → 4-track Resolve timeline:');
        PIPELINE_STEPS.forEach((st) =>
          print(
            <span className={s.outTxt}>
              <span className={s.okTxt}>{pad2(st.n)}</span> {st.name.padEnd(18)} {st.tool} <span className={s.warnTxt}>→ {st.out}</span>
            </span>,
          ),
        );
        break;

      case 'cat': {
        const q = args.join(' ').toLowerCase();
        if (!q) {
          err('usage: cat <project> — e.g. cat gamehook, cat hyperframes');
          break;
        }
        const p =
          PROJECTS.find((x) => x.name.toLowerCase() === q || x.slug.toLowerCase() === q) ??
          PROJECTS.find((x) => x.name.toLowerCase().includes(q) || x.slug.toLowerCase().includes(q)) ??
          PROJECTS.find((x) => x.tagline.toLowerCase().includes(q));
        if (!p) {
          err(`cat: no project matching '${q}'. try ls`);
          break;
        }
        ok(`${p.glyph} ${p.name} [${p.category} · ${p.status}]`);
        out(p.tagline);
        out(p.story);
        p.highlights.forEach((h) => out(`  · ${h}`));
        break;
      }

      case 'open': {
        const k = (args[0] ?? '').toLowerCase();
        const target = OPEN_MAP[k];
        if (target) {
          openApp(target);
          ok(`→ opening ${k}`);
        } else {
          err(`unknown app: ${k || '(none)'}. try: readme, projects, lab, terminal, activity, pipeline, notes, mail, github`);
        }
        break;
      }

      case 'clear':
        setLines([]);
        break;

      default:
        print(
          <span className={s.errTxt}>
            zsh: command not found: {cmd}. try <span className={s.okTxt}>help</span>
          </span>,
        );
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const raw = val.trim();
      if (!raw) return;
      hist.current.push(raw);
      hidx.current = hist.current.length;
      setVal('');
      exec(raw);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hist.current.length === 0) return;
      hidx.current = Math.max(0, hidx.current - 1);
      setVal(hist.current[hidx.current] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hidx.current >= hist.current.length) return;
      hidx.current = Math.min(hist.current.length, hidx.current + 1);
      setVal(hist.current[hidx.current] ?? '');
    }
  };

  return (
    <div onClick={() => inputRef.current?.focus()}>
      {lines.map((l) => (
        <div key={l.id} className={s.line}>
          {l.node}
        </div>
      ))}
      <div className={s.inputLine}>
        <span className={s.prompt}>teo@portfolio ~</span>
        <span className={s.okTxt}>$</span>
        <input
          ref={inputRef}
          className={s.termInput}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          aria-label="Terminal input"
        />
      </div>
      <div ref={endRef} />
    </div>
  );
}
