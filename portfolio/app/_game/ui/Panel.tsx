'use client';

import { useEffect, useState } from 'react';
import { DIALOGS } from '../data/dialogs';
import { PROJECTS, CONTACT, CATEGORY_LABELS, type Category } from '@/lib/projects';
import Battle from './Battle';
import PokerMini from './PokerMini';

interface Props {
  id: string;
  onClose: () => void;
}

export default function Panel({ id, onClose }: Props) {
  const [showBattle, setShowBattle] = useState(false);
  const [showMini, setShowMini] = useState(false);

  // close on escape (engine also closes via input, this is a safety net)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (id === 'archive') return <ArchivePanel onClose={onClose} />;
  if (id === 'contact') return <ContactPanel onClose={onClose} />;

  const dlg = DIALOGS[id];
  if (!dlg || !dlg.project) return null;
  const p = dlg.project;

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={frameStyle}>
        <div style={headerStyle}>
          <div>
            <div style={kickerStyle}>{CATEGORY_LABELS[p.category]}</div>
            <h2 style={titleStyle}>{p.name}</h2>
            <p style={taglineStyle}>{p.tagline}</p>
          </div>
          <button onClick={onClose} style={closeBtnStyle} aria-label="Close">×</button>
        </div>

        <div style={bodyStyle}>
          <section style={{ padding: '28px 40px' }}>
            <p style={{ ...storyP, fontSize: 16, lineHeight: 1.65 }}>{p.story}</p>

            <h3 style={h3Style}>Highlights</h3>
            <ul style={highlightsStyle}>
              {p.highlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>

            <h3 style={h3Style}>Stack</h3>
            <div style={chipRowStyle}>
              {p.stack.map((t) => <span key={t} style={chipStyle}>{t}</span>)}
            </div>

            {p.artifacts && p.artifacts.length > 0 && (
              <>
                <h3 style={h3Style}>Endpoints</h3>
                <div style={chipRowStyle}>
                  {p.artifacts.map((a) => <span key={a} style={{ ...chipStyle, color: '#6cf4d2', borderColor: '#3e7e7a' }}>{a}</span>)}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              <a
                href={`https://github.com/teoperalez/${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={ctaStyle}
              >
                ↗ view repo
              </a>
              {dlg.hasBattle && (
                <button onClick={() => setShowBattle(true)} style={ctaPrimaryStyle}>
                  ⚔ challenge boss
                </button>
              )}
              {dlg.hasMini === 'poker' && (
                <button onClick={() => setShowMini(true)} style={ctaPrimaryStyle}>
                  ♠ play hold'em
                </button>
              )}
              <button onClick={onClose} style={ctaGhostStyle}>← back to town</button>
            </div>
          </section>
        </div>
      </div>

      {showBattle && <Battle projectName={p.name} onClose={() => setShowBattle(false)} />}
      {showMini && <PokerMini onClose={() => setShowMini(false)} />}
    </div>
  );
}

/* ============================================================ */
/* Archive: the 26-repo browser                                 */
/* ============================================================ */

function ArchivePanel({ onClose }: { onClose: () => void }) {
  const [filter, setFilter] = useState<'all' | Category>('all');
  const cats: Array<'all' | Category> = ['all', 'overlay', 'systems', 'ai', 'web', 'tools', 'rom'];
  const visible = filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === filter);

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={frameStyle}>
        <div style={headerStyle}>
          <div>
            <div style={kickerStyle}>THE ARCHIVE</div>
            <h2 style={titleStyle}>26 repos · one room</h2>
            <p style={taglineStyle}>Filter by category. Click a row to open on GitHub.</p>
          </div>
          <button onClick={onClose} style={closeBtnStyle} aria-label="Close">×</button>
        </div>

        <div style={bodyStyle}>
          <div style={{ padding: '20px 40px 8px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                style={{
                  ...chipStyle,
                  cursor: 'pointer',
                  background: filter === c ? '#ff3c25' : 'transparent',
                  color: filter === c ? '#07070b' : '#f4ecdc',
                  borderColor: filter === c ? '#ff3c25' : 'rgba(244,236,220,0.2)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  padding: '6px 12px',
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={{ padding: '8px 40px 40px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2b2a36', color: '#8a8377', textAlign: 'left', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.15em' }}>
                  <th style={{ padding: '8px 12px', width: 32 }}>#</th>
                  <th style={{ padding: '8px 12px' }}>repo</th>
                  <th style={{ padding: '8px 12px' }}>category</th>
                  <th style={{ padding: '8px 12px' }}>tagline</th>
                  <th style={{ padding: '8px 12px' }}>status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p, i) => (
                  <tr
                    key={p.name}
                    onClick={() => window.open(`https://github.com/teoperalez/${p.slug}`, '_blank', 'noopener')}
                    style={{ borderBottom: '1px dashed #2b2a36', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,60,37,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 12px', color: '#8a8377' }}>{String(i + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '10px 12px', color: '#f4ecdc', fontWeight: 600 }}>{p.glyph} {p.name}</td>
                    <td style={{ padding: '10px 12px', color: '#ff3c25' }}>{CATEGORY_LABELS[p.category]}</td>
                    <td style={{ padding: '10px 12px', color: '#d8cfbe' }}>{p.tagline}</td>
                    <td style={{ padding: '10px 12px', color: p.status === 'shipped' ? '#6cf4d2' : '#ffb800' }}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Contact                                                      */
/* ============================================================ */

function ContactPanel({ onClose }: { onClose: () => void }) {
  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...frameStyle, maxWidth: 720 }}>
        <div style={headerStyle}>
          <div>
            <div style={kickerStyle}>CONTACT TOWER</div>
            <h2 style={titleStyle}>let&apos;s work</h2>
            <p style={taglineStyle}>open to FAANG-tier frontend roles, remote-friendly.</p>
          </div>
          <button onClick={onClose} style={closeBtnStyle} aria-label="Close">×</button>
        </div>
        <div style={bodyStyle}>
          <div style={{ padding: '32px 40px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ContactRow label="email" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
            <ContactRow label="github" value="@teoperalez" href={CONTACT.github} />
            <ContactRow label="site" value="teoperalez.com" href={CONTACT.site} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display: 'grid', gridTemplateColumns: '80px 1fr auto', alignItems: 'center',
      padding: '18px 22px', border: '1px solid rgba(244,236,220,0.2)', borderRadius: 8,
      background: 'rgba(244,236,220,0.04)', color: '#f4ecdc', textDecoration: 'none',
      gap: 12, transition: 'background 0.15s',
    }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#8a8377', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontSize: 22 }}>{value}</span>
      <span style={{ color: '#ff3c25', fontSize: 18 }}>↗</span>
    </a>
  );
}

/* ============================================================ */
/* shared styles                                                */
/* ============================================================ */

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(7,7,11,0.86)',
  backdropFilter: 'blur(8px)',
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(8px, 2vw, 32px)',
};

const frameStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 920,
  maxHeight: '92vh',
  background: '#0e0d18',
  border: '1px solid rgba(244,236,220,0.18)',
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  padding: '28px 40px 24px',
  borderBottom: '1px solid rgba(244,236,220,0.12)',
};

const kickerStyle: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: '#ff3c25',
  marginBottom: 8,
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'Instrument Serif, serif',
  fontSize: 'clamp(28px, 4vw, 44px)',
  lineHeight: 1.05,
  margin: '0 0 6px',
  color: '#f4ecdc',
  fontWeight: 400,
};

const taglineStyle: React.CSSProperties = {
  fontFamily: 'Instrument Serif, serif',
  fontStyle: 'italic',
  fontSize: 'clamp(16px, 1.7vw, 20px)',
  color: '#d8cfbe',
  margin: 0,
};

const closeBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: 'rgba(244,236,220,0.08)',
  border: '1px solid rgba(244,236,220,0.18)',
  color: '#f4ecdc',
  fontSize: 22,
  cursor: 'pointer',
  flexShrink: 0,
};

const bodyStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
};

const storyP: React.CSSProperties = {
  fontFamily: 'Geist, Inter, sans-serif',
  color: '#d8cfbe',
  margin: '0 0 20px',
};

const h3Style: React.CSSProperties = {
  fontFamily: 'Press Start 2P, monospace',
  fontSize: 10,
  letterSpacing: '0.2em',
  color: '#ff3c25',
  textTransform: 'uppercase',
  margin: '28px 0 14px',
};

const highlightsStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  color: '#d8cfbe',
  fontFamily: 'Geist, Inter, sans-serif',
  fontSize: 14.5,
  lineHeight: 1.55,
};

const chipRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };
const chipStyle: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
  padding: '5px 10px',
  border: '1px solid rgba(244,236,220,0.2)',
  borderRadius: 999,
  color: '#f4ecdc',
};

const ctaStyle: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  padding: '12px 20px',
  border: '1px solid rgba(244,236,220,0.25)',
  borderRadius: 8,
  color: '#f4ecdc',
  textDecoration: 'none',
  cursor: 'pointer',
};
const ctaPrimaryStyle: React.CSSProperties = { ...ctaStyle, background: '#ff3c25', borderColor: '#ff3c25', color: '#07070b' };
const ctaGhostStyle: React.CSSProperties = { ...ctaStyle, color: '#8a8377', borderColor: 'transparent' };
