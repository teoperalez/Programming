'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CATEGORY_LABELS, CONTACT, FEATURED, PIPELINE_STEPS, PROJECTS, type Project } from '@/lib/projects';
import Diagram from './Diagram';
import Specimen from './Specimen';
import styles from './styles.module.css';

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300..900;1,300..900&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap';

const GITHUB = 'https://github.com/teoperalez';

/* ---------- reading progress ---------- */

function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className={styles.progress} aria-hidden="true">
      <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
    </div>
  );
}

/* ---------- featured dispatch card ---------- */

function Dispatch({ project, big }: { project: Project; big?: boolean }) {
  return (
    <article className={big ? `${styles.feat} ${styles.featBig}` : styles.feat}>
      <div className={styles.featCat}>{CATEGORY_LABELS[project.category]}</div>
      <h3>
        <a href={`${GITHUB}/${project.slug}`}>{project.name}</a>
      </h3>
      <p>{project.story}</p>
      <ul className={styles.featHighlights}>
        {project.highlights.slice(0, big ? 3 : 2).map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <div className={styles.signature}>
        <span>{project.stack.slice(0, 3).join(' · ')}</span>
        <span>{project.artifacts?.[0] ?? project.status}</span>
      </div>
    </article>
  );
}

/* ---------- by-the-numbers data band ---------- */

const NUMBERS: { value: string; label: string }[] = [
  { value: String(PROJECTS.length), label: 'repos in the archive' },
  { value: String(PIPELINE_STEPS.length), label: 'pipeline steps' },
  { value: '600 Hz', label: 'peak poll rate' },
  { value: '≤30 s', label: 'clip cap' },
  { value: '1.11', label: 'FCPXML version' },
  { value: '3', label: 'release platforms — win / linux / mac' },
  { value: '2', label: 'LLM cost tiers' },
];

function NumbersBand() {
  return (
    <section className={styles.numbersBand} aria-label="By the numbers">
      <div className={styles.numbersGrid}>
        {NUMBERS.map((n) => (
          <div key={n.label} className={styles.numCell}>
            <div className={styles.numValue}>
              <em>{n.value}</em>
            </div>
            <div className={styles.numLabel}>{n.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- page ---------- */

export default function Quarterly() {
  const featuredRows = [FEATURED.slice(0, 3), FEATURED.slice(3, 6)];

  return (
    <div className={styles.page}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS_HREF} />

      <ProgressBar />

      <div className={styles.paper}>
        {/* masthead */}
        <div className={styles.masthead}>
          <div>The Peralez Quarterly · Vol. I · No. 01</div>
          <div>Today · Independent Edition</div>
          <div className={styles.mastheadRight}>
            <Link href="/" className={styles.backLink}>
              ↩ all versions
            </Link>
            <a href="#features">features</a>
            <a href="#specimen">specimen</a>
            <a href="#archive">archive</a>
            <a href="#contact">contact</a>
          </div>
        </div>

        <div className={styles.titleBlock}>
          <h1>
            The Peralez <em>Quarterly</em>
          </h1>
          <div className={styles.deck}>
            a portfolio · in <span>{PROJECTS.length} dispatches</span> · from a frontend engineer at
            large
          </div>
        </div>

        <div className={styles.issueBar}>
          <span>Issue 01 — “Hot Loops &amp; Quiet Rooms”</span>
          <span>By {CONTACT.name}</span>
          <span>For Hire · {CONTACT.email}</span>
        </div>

        {/* COVER */}
        <article className={styles.cover} id="features">
          <div>
            <div className={styles.byline}>
              Cover Story · <strong>Engineering profile</strong>
            </div>
            <h2 className={styles.coverHeadline}>
              A frontend that <em>actually moves</em>, written by the engineer who built it.
            </h2>
            <div className={styles.coverBody}>
              <p>
                I make interfaces for systems that move data really fast. Speedrun overlays read
                live emulator memory at 600 hertz. A poker solver runs Monte-Carlo equity in a
                browser tab. A twelve-step video pipeline stitches large language models into a
                Final Cut Pro XML, and a Rust emulator fork plays the result back, frame-accurate.
              </p>
              <p>
                What ties it together is a refusal to treat the front end as decoration. The bar
                that creeps from green to red on a Pokémon overlay is a debounced state machine over
                a memory address. The pretty card you’ll see further in the issue is a CSS grid
                wrapped around a 7-card poker evaluator. The pixels are the product — but the data
                behind them is the work.
              </p>
              <p>
                This is the first issue. Twenty-six dispatches follow, one of them interactive. Find
                the specimen page; play with the numbers. If the work fits the room you’re hiring
                for, the byline at the bottom is the way to reach me.
              </p>
            </div>

            <div className={styles.pull}>
              I want a frontend role where the data flying across the screen actually means
              something — live emulator state, solver output, AI pipelines, telemetry.
            </div>
          </div>

          <Diagram />
        </article>

        {/* FEATURED DISPATCHES */}
        <div className={styles.sectionRule}>
          <h2>Featured Dispatches</h2>
          <span className={styles.sectionMeta}>Volume I · pp. 4–11</span>
        </div>

        <section className={styles.features}>
          {featuredRows[0].map((p, i) => (
            <Dispatch key={p.name} project={p} big={i === 0} />
          ))}
        </section>

        <div className={styles.fleuron} />

        <section className={styles.features}>
          {featuredRows[1].map((p, i) => (
            <Dispatch key={p.name} project={p} big={i === 0} />
          ))}
        </section>

        {/* BY THE NUMBERS */}
        <NumbersBand />

        {/* POSTMORTEM COLUMN + LETTERS */}
        <div className={styles.sectionRule}>
          <h2>Field Notes &amp; Corrections</h2>
          <span className={styles.sectionMeta}>Postmortems · filed from production</span>
        </div>

        <section className={styles.stories}>
          <article className={styles.columnPiece}>
            <div className={styles.columnKicker}>The Column · RBY-GameHook postmortem</div>
            <h3>The Case of the 657 Supporting Files.</h3>
            <p>
              The crime scene was a release folder. <code>GameHook.WPF.exe</code> sat in the middle
              of it, technically present, while six hundred and fifty-seven supporting files —
              DLLs, runtime configs, satellite assemblies in languages nobody on this masthead
              speaks — sprawled around it like packing peanuts. Users were promised an application
              and handed, instead, a directory.
            </p>
            <p>
              The investigation was short and a little embarrassing, as the good ones are. The
              release workflow was running <code>dotnet build</code>. Build is a developer’s verb;
              it assumes the framework, the dependencies, and the patience are already on the
              machine. The verb the situation wanted was <code>dotnet publish</code> with{' '}
              <code>PublishSingleFile=true</code>, which folds the entire .NET 8 runtime and every
              dependency into one self-contained executable.
            </p>
            <p>
              After the correction, the evidence reads differently.{' '}
              <code>GameHook.WebAPI.exe</code>: a single self-contained binary of roughly 55 MB,
              verified the boring way — launched on a clean machine and observed serving{' '}
              <code>localhost:8085</code>. <code>GameHook.WPF.exe</code>: roughly 99 MB, a WebView2
              shell, also one file. The lingering pile of satellite-locale resources was silenced
              with <code>SatelliteResourceLanguages=en</code>, and a post-publish cleanup target
              sweeps up anything that doesn’t take the hint.
            </p>
            <p className={styles.moral}>
              <strong>Moral</strong>
              A release is not what compiles on your machine; it is what survives arrival on
              someone else’s.
            </p>
          </article>

          <aside className={styles.letters}>
            <p className={styles.lettersHead}>Letters to the Editor</p>
            <h3>The token that broke every push.</h3>
            <p>
              Sirs — for one long afternoon, every <code>git push</code> to{' '}
              <em>github.com/teoperalez/*</em> died with a 403. Not loudly; git does not
              editorialize. It simply declines. Credentials were rotated, remotes re-cloned, and
              several keyboards addressed in a tone this publication cannot print.
            </p>
            <p>
              The culprit: a <code>GITHUB_TOKEN</code> environment variable, set long ago for some
              forgotten automation, quietly outranking the perfectly good credentials beneath it.
              The fix was one line — <code>Remove-Item Env:\GITHUB_TOKEN</code> — which has since
              been enshrined in the workspace’s <em>AGENTS.md</em>, where every AI agent reads it at
              the top of a session and applies it before touching a remote. The machines, at least,
              learn from our mistakes, provided we write them down.
            </p>
            <p className={styles.lettersSig}>— The Editor · filed under: environment, hubris</p>
          </aside>
        </section>

        {/* PULL QUOTE — locked decision */}
        <section className={styles.pullQuoteBlock}>
          <blockquote>
            Every audited line is its own approve/reject record; rejected lines block render.
          </blockquote>
          <cite className={styles.pullQuoteCite}>
            — IRLPC Hyperframes pipeline spec · locked decision, step{' '}
            {PIPELINE_STEPS.find((s) => s.name === 'approval gate')?.n ?? 9} of{' '}
            {PIPELINE_STEPS.length}
          </cite>
        </section>

        {/* SPECIMEN */}
        <Specimen />

        {/* ARCHIVE */}
        <div className={styles.sectionRule} id="archive">
          <h2>The Archive — every repo, in order</h2>
          <span className={styles.sectionMeta}>
            {PROJECTS.length} entries · github.com/teoperalez
          </span>
        </div>

        <section className={styles.archive}>
          <table>
            <thead>
              <tr>
                <th className={styles.archiveNum}>no.</th>
                <th>title</th>
                <th>category</th>
                <th>summary</th>
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map((p, i) => (
                <tr key={`${p.name}-${i}`}>
                  <td className={styles.archiveNum}>{String(i + 1).padStart(2, '0')}</td>
                  <td>
                    <a href={`${GITHUB}/${p.slug}`}>{p.name}</a>
                  </td>
                  <td className={styles.archiveCat}>{CATEGORY_LABELS[p.category]}</td>
                  <td>{p.tagline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* COLOPHON */}
        <section className={styles.colophon} id="contact">
          <div>
            <h4>The byline</h4>
            <p className={styles.colophonBig}>
              {CONTACT.name},
              <br />
              frontend engineer.
            </p>
            <p>Available for full-time and contract work. Remote, with happy IDE.</p>
          </div>
          <div>
            <h4>Reach</h4>
            <p>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </p>
            <p>
              <a href={CONTACT.github}>github.com/teoperalez</a>
            </p>
            <p>
              <a href={CONTACT.site}>teoperalez.com</a>
            </p>
          </div>
          <div>
            <h4>Colophon</h4>
            <p>
              Set in Fraunces &amp; Inter. Typeset as a Next.js App Router route under{' '}
              <em>app/v2-editorial/</em>, statically exported, no analytics.
            </p>
            <p>
              <Link href="/" className={styles.backLink}>
                ↩ all versions
              </Link>
            </p>
          </div>
        </section>

        <footer className={styles.footerFoot}>
          <span>The Peralez Quarterly · Issue 01</span>
          <span>© 2026 · printed in a browser near you</span>
        </footer>
      </div>
    </div>
  );
}
