'use client';

import s from '../styles.module.css';
import { CONTACT, PROJECTS } from '@/lib/projects';

export default function Readme() {
  return (
    <div className={s.readme}>
      <h1>{CONTACT.name}</h1>
      <div className={s.rdEm}>{'// frontend engineer · open to work · 2026'}</div>

      <p>
        I build interfaces for systems that move data really fast. Pokémon speedrun overlays that read live emulator
        memory at 600 Hz. A poker solver that runs Monte-Carlo in a browser tab. A twelve-step AI video pipeline that
        emits FCPXML 1.11 for DaVinci Resolve. A .NET 8 memory poller that publishes its own auto-updater feed.{' '}
        {PROJECTS.length} public repos.
      </p>

      <div className={s.statRow}>
        <div className={s.stat}>
          <b>{PROJECTS.length}</b>
          <span>repos shipped</span>
        </div>
        <div className={s.stat}>
          <b>14</b>
          <span>languages used</span>
        </div>
        <div className={s.stat}>
          <b>600 Hz</b>
          <span>peak poll rate</span>
        </div>
      </div>

      <h2>## what i&apos;m looking for</h2>
      <p>
        A <code>frontend</code> role where the data flying around actually means something. Real-time. Heavy-state.
        Streams, sockets, telemetry, solvers. Happy on React / Next / Electron / vanilla. Remote-friendly.
      </p>

      <h2>## what i ship</h2>
      <ul>
        <li>Electron + React speedrun overlays — three of them (Gen 1, 2, 3).</li>
        <li>.NET 8 WPF + WebAPI memory poller (RBY-GameHook), single-file, auto-updating.</li>
        <li>Rust emulator fork (AhShuckie) with REST API for deterministic replay record/playback.</li>
        <li>12-step LLM video pipeline emitting FCPXML 1.11 for Resolve.</li>
        <li>Next.js sites for a paid community: tierlists, status screens, downloads.</li>
        <li>Hold&apos;em solver, background scheduler, equity widgets.</li>
        <li>Hybrid background-removal CV app + companion review/touchup GUIs.</li>
      </ul>

      <h2>## tour the desktop</h2>
      <p>
        Open <code>Projects</code> in the dock for the full file tree — click a row for a preview, double-click to jump
        to GitHub. <code>Damage Lab</code> runs the actual Gen 2 damage formula. <code>Terminal</code> takes commands —
        try <code>ls</code>, <code>cat gamehook</code>, <code>ports</code>, or <code>open pipeline</code>.{' '}
        <code>Pipeline</code> animates the real 12-step Hyperframes flow (including the approval gate).{' '}
        <code>Notes</code> holds three engineering war stories. <code>Activity Monitor</code> shows simulated live
        polling. <code>Mail</code> drops you straight into a draft to me.
      </p>

      <h2>## contact</h2>
      <p>
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        <br />
        <a href={CONTACT.github} target="_blank" rel="noopener noreferrer">
          github.com/teoperalez
        </a>
        <br />
        <a href={CONTACT.site} target="_blank" rel="noopener noreferrer">
          teoperalez.com
        </a>
      </p>
    </div>
  );
}
