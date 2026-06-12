'use client';

import { PROJECTS, CONTACT, FEATURED, CATEGORY_LABELS } from '@/lib/projects';

interface Props { onClose: () => void; }

/**
 * Accessibility / "FAANG manager has 90 seconds" view.
 *
 * Full résumé-style content with every project, no game, no canvas. Reachable
 * via TAB at any time. Linear. Screen-reader-friendly.
 */
export default function ReadMode({ onClose }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#07070b', color: '#f4ecdc',
      overflowY: 'auto', fontFamily: 'Geist, Inter, sans-serif',
      padding: 'clamp(24px, 5vw, 80px)',
    }}>
      <button onClick={onClose} style={{
        position: 'fixed', top: 18, right: 18, padding: '8px 16px',
        background: '#ff3c25', color: '#07070b', border: 'none', borderRadius: 8,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.15em',
        textTransform: 'uppercase', cursor: 'pointer', zIndex: 10,
      }}>
        ← back to game [tab]
      </button>

      <header style={{ maxWidth: 880, margin: '0 auto 64px' }}>
        <p style={kicker}>text-only view · for FAANG hiring managers in a hurry</p>
        <h1 style={{
          fontFamily: 'Instrument Serif, serif', fontSize: 'clamp(48px, 8vw, 96px)',
          lineHeight: 0.95, margin: 0, fontWeight: 400, letterSpacing: '-0.02em',
        }}>
          {CONTACT.name}
        </h1>
        <p style={{
          fontFamily: 'Instrument Serif, serif', fontStyle: 'italic',
          fontSize: 'clamp(18px, 2vw, 26px)', color: '#d8cfbe',
          margin: '12px 0 24px', maxWidth: '50ch',
        }}>
          Frontend engineer. {PROJECTS.length} shipped repos. Open to FAANG-tier roles,
          remote-friendly. Strongest at real-time UIs over live systems — emulator memory,
          AI pipelines, solvers.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          <a href={`mailto:${CONTACT.email}`} style={contactA}>{CONTACT.email}</a>
          <a href={CONTACT.github} style={contactA}>github.com/teoperalez</a>
          <a href={CONTACT.site} style={contactA}>teoperalez.com</a>
        </div>
      </header>

      <section style={{ maxWidth: 880, margin: '0 auto 64px' }}>
        <h2 style={h2}>Featured work</h2>
        {FEATURED.map((p) => (
          <article key={p.name} style={{ marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid rgba(244,236,220,0.12)' }}>
            <p style={kicker}>{CATEGORY_LABELS[p.category]} · {p.status}</p>
            <h3 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 30, margin: '4px 0 8px', fontWeight: 400 }}>
              {p.name}
            </h3>
            <p style={{ fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontSize: 18, color: '#d8cfbe', margin: '0 0 14px' }}>
              {p.tagline}
            </p>
            <p style={{ fontSize: 15, color: '#d8cfbe', lineHeight: 1.65, margin: '0 0 14px' }}>
              {p.story}
            </p>
            <ul style={{ paddingLeft: 18, color: '#d8cfbe', fontSize: 14, lineHeight: 1.6 }}>
              {p.highlights.map((h, i) => <li key={i} style={{ marginBottom: 6 }}>{h}</li>)}
            </ul>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {p.stack.map((t) => <span key={t} style={chip}>{t}</span>)}
            </div>
            <a href={`https://github.com/teoperalez/${p.slug}`} style={{ ...contactA, marginTop: 14, display: 'inline-block' }}>
              ↗ github
            </a>
          </article>
        ))}
      </section>

      <section style={{ maxWidth: 880, margin: '0 auto 64px' }}>
        <h2 style={h2}>All {PROJECTS.length} repos</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(244,236,220,0.18)', textAlign: 'left', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.15em', color: '#8a8377' }}>
              <th style={{ padding: '8px 12px' }}>repo</th>
              <th style={{ padding: '8px 12px' }}>category</th>
              <th style={{ padding: '8px 12px' }}>tagline</th>
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map((p) => (
              <tr key={p.name} style={{ borderBottom: '1px dashed rgba(244,236,220,0.08)' }}>
                <td style={{ padding: '8px 12px', color: '#f4ecdc' }}>
                  <a href={`https://github.com/teoperalez/${p.slug}`} style={{ color: '#f4ecdc' }}>
                    {p.glyph} {p.name}
                  </a>
                </td>
                <td style={{ padding: '8px 12px', color: '#ff3c25' }}>{CATEGORY_LABELS[p.category]}</td>
                <td style={{ padding: '8px 12px', color: '#d8cfbe' }}>{p.tagline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer style={{ maxWidth: 880, margin: '0 auto', paddingTop: 32, borderTop: '1px solid rgba(244,236,220,0.12)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8377' }}>
        © 2026 {CONTACT.name} · this view exists because reading time matters
      </footer>
    </div>
  );
}

const kicker: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.25em',
  textTransform: 'uppercase', color: '#ff3c25', margin: '0 0 8px',
};
const h2: React.CSSProperties = {
  fontFamily: 'Instrument Serif, serif', fontSize: 36, fontWeight: 400, margin: '0 0 24px',
};
const contactA: React.CSSProperties = {
  color: '#6cf4d2', textDecoration: 'none', borderBottom: '1px solid rgba(108,244,210,0.4)',
  paddingBottom: 2, letterSpacing: '0.05em',
};
const chip: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace', fontSize: 11, padding: '3px 8px',
  border: '1px solid rgba(244,236,220,0.2)', borderRadius: 999, color: '#d8cfbe',
};
