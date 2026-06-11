'use client';

import { useState, type ReactNode } from 'react';
import s from '../styles.module.css';

interface Note {
  id: string;
  title: string;
  meta: string;
  body: ReactNode;
}

const NOTES: Note[] = [
  {
    id: 'gamehook-657',
    title: '657 supporting files',
    meta: 'RBY-GameHook · postmortem',
    body: (
      <>
        <p>
          Users unzipped a GameHook release and got the exe drowning in <code>657 supporting files</code>. The
          distribution looked broken because it was: I had been shipping the output of <code>dotnet build</code>, which
          dumps every dependency DLL, runtime piece, and satellite assembly next to the binary.
        </p>
        <p>
          The fix was embarrassing in hindsight: <code>dotnet publish</code> with{' '}
          <code>PublishSingleFile=true</code> (self-contained), not <code>dotnet build</code>. Build compiles; publish
          packages.
        </p>
        <p>
          Result: <code>GameHook.WebAPI.exe</code> as a ~55 MB single-file self-contained binary and{' '}
          <code>GameHook.WPF.exe</code> at ~99 MB, both verified working — the WebAPI serving overlays on{' '}
          <code>localhost:8085</code>. Bonus cleanup: <code>SatelliteResourceLanguages=en</code> plus a post-publish
          target killed the locale-folder noise for good.
        </p>
      </>
    ),
  },
  {
    id: 'nsis-mmap',
    title: 'NSIS: failed creating mmap',
    meta: 'RSENewLayout · open bug',
    body: (
      <>
        <p>
          RSENewLayout&apos;s Windows installer dies mid-package: NSIS reports{' '}
          <code>failed creating mmap</code> while processing the <code>.nsis.7z</code> archive that electron-builder
          feeds it. The macOS dmg side of the same pipeline ships fine, which makes it a Windows-packaging problem, not
          an app problem.
        </p>
        <p>
          Current suspect list, in order: (1) disk space — mmap needs room to map the full archive; (2) file locks — a
          live overlay process or antivirus scanning the staging directory while NSIS maps it; (3) Unicode characters
          in the app description string leaking into the installer metadata.
        </p>
        <p>
          This is the unglamorous archaeology that shipping real desktop software actually is: the code is done, the
          packaging fights back.
        </p>
      </>
    ),
  },
  {
    id: 'cursed-token',
    title: 'The cursed GITHUB_TOKEN',
    meta: 'meta-repo · fixed + codified',
    body: (
      <>
        <p>
          Every push to GitHub started returning <code>403</code> — silently, with credentials that worked yesterday.
          No error pointed at the real cause: a stale <code>GITHUB_TOKEN</code> environment variable was set in the
          shell, and git preferred it over the keychain credentials on every single push.
        </p>
        <p>
          The fix is one line of PowerShell: <code>Remove-Item Env:\GITHUB_TOKEN</code>. Push works instantly
          afterwards.
        </p>
        <p>
          The real fix is institutional: the gotcha is now codified in <code>AGENTS.md</code> so no coding agent (or
          future me) burns an afternoon rediscovering it. Environment variables that authenticate silently should be
          treated as radioactive.
        </p>
      </>
    ),
  },
];

export default function Notes() {
  const [selId, setSelId] = useState(NOTES[0].id);
  const sel = NOTES.find((n) => n.id === selId) ?? NOTES[0];

  return (
    <div className={s.notesSplit}>
      <aside className={s.notesList}>
        {NOTES.map((n) => (
          <div
            key={n.id}
            className={`${s.noteItem} ${n.id === sel.id ? s.noteSel : ''}`}
            onClick={() => setSelId(n.id)}
          >
            <div className={s.noteTitle}>{n.title}</div>
            <div className={s.noteMeta}>{n.meta}</div>
          </div>
        ))}
      </aside>
      <main className={s.noteDetail}>
        <h3>{sel.title}</h3>
        <div className={s.noteDetailMeta}>{sel.meta}</div>
        {sel.body}
      </main>
    </div>
  );
}
