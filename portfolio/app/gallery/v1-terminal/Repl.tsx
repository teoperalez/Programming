'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { PROJECTS, CONTACT, PIPELINE_STEPS, type Project } from '@/lib/projects';
import { MONS, MOVES, calcDamage } from '@/lib/pokemon';
import styles from './styles.module.css';

/* ---------- shared content (also rendered as a static section) ---------- */

export interface WarStory {
  title: string;
  lines: string[];
  fix: string;
}

export const WARSTORIES: WarStory[] = [
  {
    title: 'the 657 supporting files',
    lines: [
      'RBY-GameHook shipped with 657 loose supporting files sitting next to the exe — every release, nobody could say why.',
      'root cause: the release workflow ran `dotnet build` instead of `dotnet publish` with PublishSingleFile=true.',
    ],
    fix: 'now both exes are single-file self-contained — ~55 MB WebAPI, ~99 MB WPF.',
  },
  {
    title: 'the cursed GITHUB_TOKEN',
    lines: [
      'a misconfigured GITHUB_TOKEN env var silently broke every `git push` with a misleading 403.',
      'the credentials were fine. the remotes were fine. the env var was poisoning auth in every session.',
    ],
    fix: 'fix: `Remove-Item Env:\\GITHUB_TOKEN` in every session.',
  },
];

export const PORTS: Array<[string, string]> = [
  ['localhost:8085', 'RBY-GameHook WebAPI (GameHook.WebAPI.exe, single-file ~55 MB)'],
  ['127.0.0.1:55356', 'AhShuckie PokeAByte UDP / shared-memory protocol'],
  ['127.0.0.1:30158', 'AhShuckie REST API (/stats, /go-to-frame, /load-replay, …)'],
  ['localhost:5173', 'Hyperframes approval gate (React + Express, per-line approve/reject)'],
];

/* ---------- fuzzy project matching ---------- */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export function findProject(q: string): Project | undefined {
  const nq = norm(q);
  if (!nq) return undefined;
  let best: Project | undefined;
  let bestScore = 0;
  for (const p of PROJECTS) {
    let score = 0;
    for (const cand of [norm(p.slug), norm(p.name)]) {
      if (cand === nq) score = Math.max(score, 4);
      else if (cand.startsWith(nq)) score = Math.max(score, 3);
      else if (cand.includes(nq)) score = Math.max(score, 2);
      else if (nq.includes(cand)) score = Math.max(score, 1);
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

/* ---------- REPL ---------- */

type LineClass = 'cmd' | 'out' | 'err' | 'ok' | 'muted' | 'h';

interface Entry {
  id: number;
  cls: LineClass;
  body: ReactNode;
}

const HELP_CHIPS = [
  'ls',
  'cat <project>',
  'skills',
  'ports',
  'pipeline',
  'warstories',
  'contact',
  'about',
  'damage <atk> <def> <move>',
  'open <repo>',
  'clear',
];

const DAMAGE_DEFAULTS = { stab: true, crit: false, burn: false, screen: false, weather: false };

export default function Repl({ inputRef }: { inputRef?: RefObject<HTMLInputElement | null> }) {
  const [entries, setEntries] = useState<Entry[]>([
    { id: 0, cls: 'out', body: 'welcome to the teo terminal · type a command and hit enter' },
  ]);
  const [value, setValue] = useState('');

  const idRef = useRef(1);
  const historyRef = useRef<HTMLDivElement>(null);
  const cmdHistoryRef = useRef<string[]>([]);
  const histIdxRef = useRef<number | null>(null);
  const draftRef = useRef('');

  useEffect(() => {
    const node = historyRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [entries]);

  const run = (raw: string) => {
    const batch: Entry[] = [];
    const print = (cls: LineClass, body: ReactNode) =>
      batch.push({ id: idRef.current++, cls, body });

    const [cmd = '', ...args] = raw.split(/\s+/);
    const name = cmd.toLowerCase();

    if (name === 'clear') {
      setEntries([]);
      return;
    }

    print('cmd', raw);

    const printWarstories = () => {
      WARSTORIES.forEach((w, i) => {
        print('h', `── ${w.title} ──`);
        w.lines.forEach((l) => print('out', l));
        print('ok', w.fix);
        if (i < WARSTORIES.length - 1) print('out', ' ');
      });
    };

    switch (name) {
      case 'help':
      case 'h':
      case '?':
        print(
          'out',
          <>
            available:{' '}
            {HELP_CHIPS.map((c) => (
              <span key={c}>
                <kbd>{c}</kbd>{' '}
              </span>
            ))}
            · ↑/↓ walks your command history
          </>,
        );
        break;

      case 'ls':
      case 'projects':
        print('out', PROJECTS.map((p) => `· ${p.name}`).join('\n'));
        print('muted', `${PROJECTS.length} repos — \`cat <name>\` for any of them`);
        break;

      case 'skills':
        print(
          'out',
          'typescript · react · electron · next.js · node · c# / .net 8 · rust · python · canvas · webgl · ffmpeg · fcpxml · gha · wpf · z80 asm',
        );
        break;

      case 'contact':
        print(
          'out',
          <>
            mail: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            {'\n'}
            github: <a href={CONTACT.github}>{CONTACT.github.replace('https://', '')}</a>
            {'\n'}
            site: <a href={CONTACT.site}>{CONTACT.site.replace('https://', '')}</a>
          </>,
        );
        break;

      case 'about':
        print(
          'out',
          `i build interfaces for hot loops: live emulator state, monte-carlo solvers, ai pipelines, speedrun overlays. polyglot by necessity. ${PROJECTS.length} public repos under github.com/teoperalez.`,
        );
        break;

      case 'whoami':
        print('out', 'teo peralez — frontend engineer. open to work.');
        break;

      case 'open': {
        const q = args.join(' ');
        if (!q) {
          print('err', 'usage: open <repo> — e.g. open gamehook');
          break;
        }
        const p = findProject(q);
        const slug = p ? p.slug : args[0];
        const url = `https://github.com/teoperalez/${slug}`;
        print(
          'out',
          <>
            → opening{' '}
            <a href={url} target="_blank" rel="noopener noreferrer">
              {url.replace('https://', '')}
            </a>{' '}
            in a new tab
          </>,
        );
        window.open(url, '_blank', 'noopener');
        break;
      }

      case 'cat': {
        const q = args.join(' ');
        if (!q) {
          print('err', 'usage: cat <project> — e.g. cat gamehook');
          break;
        }
        if (/^warstories(\.log)?$/i.test(q)) {
          printWarstories();
          break;
        }
        const p = findProject(q);
        if (!p) {
          print('err', `cat: no such file: ${q} — try \`ls\` then \`cat <name>\``);
          break;
        }
        print('h', `${p.name} — ${p.tagline}`);
        print('out', p.story);
        p.highlights.forEach((hl) => print('out', `  · ${hl}`));
        print('muted', `stack: ${p.stack.join(' · ')} — status: ${p.status}`);
        break;
      }

      case 'ports':
        print('out', PORTS.map(([addr, what]) => `${addr.padEnd(18)} ${what}`).join('\n'));
        break;

      case 'pipeline':
        print(
          'out',
          PIPELINE_STEPS.map(
            (s) => `${String(s.n).padStart(2, '0')} ${s.name} — ${s.tool} → ${s.out}`,
          ).join('\n'),
        );
        break;

      case 'warstories':
        printWarstories();
        break;

      case 'damage': {
        if (args.length < 3) {
          print('err', 'usage: damage <attacker> <defender> <move> — e.g. damage gengar venusaur thunderbolt');
          break;
        }
        const findMon = (q: string) =>
          MONS.find((m) => norm(m.name) === norm(q)) ??
          MONS.find((m) => norm(m.name).startsWith(norm(q)));
        const a = findMon(args[0]);
        const d = findMon(args[1]);
        const moveQ = norm(args.slice(2).join(' '));
        const mv =
          MOVES.find((m) => norm(m.name) === moveQ) ??
          MOVES.find((m) => norm(m.name).startsWith(moveQ) || moveQ.startsWith(norm(m.name)));
        if (!a || !d || !mv) {
          if (!a) print('err', `unknown mon: ${args[0]}`);
          if (!d) print('err', `unknown mon: ${args[1]}`);
          if (!mv) print('err', `unknown move: ${args.slice(2).join(' ')}`);
          print('muted', `mons : ${MONS.map((m) => m.name.toLowerCase()).join(' · ')}`);
          print('muted', `moves: ${MOVES.map((m) => m.name.toLowerCase()).join(' · ')}`);
          break;
        }
        const r = calcDamage(a, d, mv, DAMAGE_DEFAULTS);
        const filled = Math.round(r.pctHi / 3);
        const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, 33 - filled));
        print('out', `> ${a.name.toLowerCase()} uses ${mv.name.toLowerCase()} on ${d.name.toLowerCase()} (STAB auto, no crit/burn/screen/weather)`);
        print('out', `  effectiveness x${r.effect} · damage ${r.lo}–${r.hi} (${r.pctLo}%–${r.pctHi}% of ${d.hp} HP)`);
        print(r.effect === 0 ? 'err' : 'ok', r.verdict);
        print('out', `  ${bar}  ${r.pctHi}%`);
        break;
      }

      default:
        print(
          'err',
          <>
            command not found: {name}. try <kbd>help</kbd>
          </>,
        );
    }

    setEntries((prev) => [...prev, ...batch]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const cmds = cmdHistoryRef.current;
    if (e.key === 'Enter') {
      const raw = value.trim();
      if (!raw) return;
      cmds.push(raw);
      histIdxRef.current = null;
      setValue('');
      run(raw);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmds.length === 0) return;
      if (histIdxRef.current === null) {
        draftRef.current = value;
        histIdxRef.current = cmds.length - 1;
      } else {
        histIdxRef.current = Math.max(0, histIdxRef.current - 1);
      }
      setValue(cmds[histIdxRef.current]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdxRef.current === null) return;
      histIdxRef.current += 1;
      if (histIdxRef.current >= cmds.length) {
        histIdxRef.current = null;
        setValue(draftRef.current);
      } else {
        setValue(cmds[histIdxRef.current]);
      }
    }
  };

  return (
    <div className={styles.repl}>
      <div className={styles.hint}>
        try one of: <kbd>ls</kbd> <kbd>cat gamehook</kbd> <kbd>ports</kbd> <kbd>pipeline</kbd>{' '}
        <kbd>warstories</kbd> <kbd>damage gengar venusaur thunderbolt</kbd> <kbd>contact</kbd>{' '}
        <kbd>clear</kbd>
      </div>
      <div className={styles.replHistory} ref={historyRef}>
        {entries.map((entry) => (
          <span key={entry.id} className={`${styles.line} ${styles[entry.cls]}`}>
            {entry.body}
          </span>
        ))}
      </div>
      <div className={styles.replInput}>
        <input
          ref={inputRef}
          className={styles.replField}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="type something…"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label="terminal command input"
        />
      </div>
    </div>
  );
}
