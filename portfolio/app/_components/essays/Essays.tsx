import s from './Essays.module.css';

export default function Essays() {
  return (
    <section className={s.section} id="essays">
      <div className={s.head}>
        <div>
          <p className={s.kicker}>
            <span className={s.num}>05</span>
            essays
          </p>
          <h2 className={s.title}>
            three short reads on <em>how I build.</em>
          </h2>
        </div>
        <p className={s.subnote}>~ 90 seconds each</p>
      </div>

      <div className={s.grid}>
        <article className={s.essay}>
          <p className={s.eyebrow}>field notes · 01</p>
          <h3 className={s.essayTitle}>Hot loops over CRUD.</h3>
          <div className={s.essayBody}>
            <p>
              Most frontend roles are CRUD. Fetch a list, render a list, edit a row, save it.
              I respect that work, but I learn nothing from it. The interesting frontends are
              the ones over a <strong>hot loop</strong> — live emulator memory, a Monte-Carlo
              solver, a websocket of telemetry, an AI pipeline mid-run.
            </p>
            <p>
              I picked the projects I picked on purpose. The Pokémon overlays read live RAM at
              600 Hz; the GameHook tap polls every cell every millisecond and the React layer
              re-renders only what changed. The poker solver evaluates 30 000 hands a second
              in the browser and the equity bar converges in front of you. None of these are
              hard because the React is hard. They're hard because the data is impatient.
            </p>
            <p>
              That's the frontend I want to keep building. If your product has a moment where
              the answer arrives faster than the user can read it — let's talk.
            </p>
          </div>
          <div className={s.essayMeta}>by Teo Peralez · 2026</div>
        </article>

        <article className={s.essay}>
          <p className={s.eyebrow}>field notes · 02</p>
          <h3 className={s.essayTitle}>657 files: when <em>build</em> became <em>publish</em>.</h3>
          <div className={s.essayBody}>
            <p>
              For weeks, RBY-GameHook shipped as an executable surrounded by 657 supporting
              files. Users dragged the folder around and reported "looks broken." It looked
              broken because it was wearing the build directory as a costume.
            </p>
            <p>
              The diagnosis took longer than it should have. I was running{' '}
              <code>dotnet build -c Release</code> and grabbing the output, which is exactly
              the kind of small wrong thing that hides in plain sight. The fix:{' '}
              <code>dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeAllContentForSelfExtract=true</code>.
            </p>
            <p>
              Result: a 55 MB WebAPI exe and a 99 MB WPF shell, both single files, both
              self-contained, both verified serving <code>localhost:8085</code>. The deeper
              lesson — the one I now apply to every desktop ship — is that{' '}
              <strong>distribution is a first-class engineering problem</strong>, not a chore
              after.
            </p>
          </div>
          <div className={s.essayMeta}>postmortem · GameHook · 2026</div>
        </article>

        <article className={s.essay}>
          <p className={s.eyebrow}>field notes · 03</p>
          <h3 className={s.essayTitle}>Engineering around LLM economics.</h3>
          <div className={s.essayBody}>
            <p>
              The Hyperframes pipeline is twelve LLM-touching steps. If every step ran on a
              frontier model the per-video cost would be embarrassing. So I picked a tier per
              step the way you pick a stat per Pokémon.
            </p>
            <p>
              <strong>gpt-4o-mini</strong> does the bulk grind — classifying A-roll vs B-roll
              by loudness and filename hints, drafting section scripts, fetching research
              tidbits. <strong>Claude Sonnet</strong> handles two jobs: the interactive Q&amp;A
              that builds the skeleton plan, and the strict <code>--strict</code> audit pass
              that rejects loose lines. A human gate on <code>localhost:5173</code> approves
              or rejects each line before render — rejected lines block clip generation.
            </p>
            <p>
              The result is a video pipeline that costs cents per minute, not dollars, and
              still produces edits I can hand to DaVinci Resolve. The lesson is the obvious
              one I keep having to relearn: <strong>LLMs are infrastructure, not magic</strong>.
              You wire them like any other dependency.
            </p>
          </div>
          <div className={s.essayMeta}>field notes · Hyperframes · 2026</div>
        </article>
      </div>
    </section>
  );
}
