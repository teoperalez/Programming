'use client';

import s from './CaseStudies.module.css';
import ArchOverlay from './ArchOverlay';
import PipelineViz from './PipelineViz';
import MemoryViz from './MemoryViz';
import { PROJECTS, type Project } from '@/lib/projects';

interface CaseDef {
  num: string;
  project: Project;
  metrics: { num: string; unit?: string; lbl: string }[];
  viz: 'arch' | 'pipeline' | 'memory';
  vizLabel: string;
}

const CASES: CaseDef[] = [
  {
    num: '01',
    project: PROJECTS.find((p) => p.name === 'GSCNewLayout')!,
    metrics: [
      { num: '3', lbl: 'gens supported' },
      { num: '600', unit: 'Hz', lbl: 'live poll rate' },
      { num: '2', lbl: 'os targets' },
      { num: '8', lbl: 'damage modifiers' },
    ],
    viz: 'arch',
    vizLabel: 'fig. 01 · the live data path',
  },
  {
    num: '02',
    project: PROJECTS.find((p) => p.name === 'RBY-GameHook')!,
    metrics: [
      { num: '55', unit: 'MB', lbl: 'webapi single-file' },
      { num: '99', unit: 'MB', lbl: 'wpf single-file' },
      { num: '3', lbl: 'release platforms' },
      { num: '657', lbl: 'files killed' },
    ],
    viz: 'memory',
    vizLabel: 'fig. 02 · simulated 600 Hz poll',
  },
  {
    num: '03',
    project: PROJECTS.find((p) => p.name === 'IRLPC Hyperframes')!,
    metrics: [
      { num: '12', lbl: 'orchestrated steps' },
      { num: '2', lbl: 'llm cost tiers' },
      { num: '4', lbl: 'fcpxml tracks' },
      { num: '30', unit: 's', lbl: 'per-clip cap' },
    ],
    viz: 'pipeline',
    vizLabel: 'fig. 03 · scroll to run',
  },
  {
    num: '04',
    project: PROJECTS.find((p) => p.name === 'AhShuckie')!,
    metrics: [
      { num: '10', unit: '×', lbl: 'unlocked speed' },
      { num: '2', lbl: 'rest endpoints added' },
      { num: 'zstd', lbl: 'replay codec' },
      { num: 'GPL-3', lbl: 'license preserved' },
    ],
    viz: 'arch',
    vizLabel: 'fig. 04 · ports & flow',
  },
];

export default function CaseStudies() {
  return (
    <section className={s.section} id="work">
      <div className={s.sectionHead}>
        <div>
          <p className={s.kicker}>
            <span className={s.num}>02</span>
            the work
          </p>
          <h2 className={s.title}>
            four shipped projects, <em>told properly.</em>
          </h2>
        </div>
        <p className={s.subnote}>case studies · scroll to read</p>
      </div>

      {CASES.map((c) => (
        <article key={c.num} className={s.case}>
          <div className={s.left}>
            <div className={s.tagRow}>
              <span className={s.tag}>{c.num}</span>
              <span className={`${s.tag} ${s.active}`}>{c.project.category}</span>
              <span className={s.tag}>{c.project.status}</span>
            </div>
            <h3 className={s.caseTitle}>
              {c.project.name.split('—')[0].trim()}
            </h3>
            <p className={s.tagline}>{c.project.tagline}</p>

            <div className={s.metrics}>
              {c.metrics.map((m, i) => (
                <div key={i} className={s.metric}>
                  <span className={s.num}>
                    <b>{m.num}</b>
                    {m.unit && (
                      <span style={{ fontSize: '0.5em', marginLeft: 4, fontStyle: 'normal' }}>
                        {m.unit}
                      </span>
                    )}
                  </span>
                  <span className={s.lbl}>{m.lbl}</span>
                </div>
              ))}
            </div>

            <a
              className={s.cta}
              href={`https://github.com/teoperalez/${c.project.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              read the code
              <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M5 12h12l-4-4 1.4-1.4L20.8 12l-6.4 5.4L13 16l4-4H5z"/></svg>
            </a>
          </div>

          <div className={s.right}>
            <div className={s.story}>
              {c.project.story.split('. ').reduce<string[][]>((acc, sentence, i) => {
                const para = Math.floor(i / 3);
                if (!acc[para]) acc[para] = [];
                acc[para].push(sentence);
                return acc;
              }, []).map((para, i) => (
                <p key={i}>{para.join('. ').replace(/\.+$/, '')}.</p>
              ))}
            </div>

            <ul className={s.highlights}>
              {c.project.highlights.slice(0, 4).map((h, i) => (
                <li key={i}>
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <div className={s.viz}>
              <span className={s.label}>{c.vizLabel}</span>
              {c.viz === 'arch' && <ArchOverlay />}
              {c.viz === 'memory' && <MemoryViz />}
              {c.viz === 'pipeline' && <PipelineViz />}
            </div>

            {c.project.artifacts && c.project.artifacts.length > 0 && (
              <div className={s.artifacts}>
                {c.project.artifacts.map((a) => (
                  <span key={a} className={s.chip}>{a}</span>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
