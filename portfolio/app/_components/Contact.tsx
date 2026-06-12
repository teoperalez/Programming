'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CONTACT } from '@/lib/projects';

export default function Contact() {
  const wordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = wordRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * 0.05;
      const dy = (e.clientY - cy) * 0.05;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onLeave = () => { el.style.transform = 'translate(0, 0)'; };
    window.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section
      id="contact"
      style={{
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: '140px clamp(28px, 6vw, 110px) 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-15%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(255,60,37,0.32) 0%, transparent 60%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-15%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(108,244,210,0.18) 0%, transparent 60%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280 }}>
        <p
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 12,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--fire)',
            margin: '0 0 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span style={{ border: '1px solid var(--line-2)', padding: '3px 8px', borderRadius: 4, color: 'var(--paper)' }}>06</span>
          let's work
        </p>
        <h2
          style={{
            fontFamily: 'var(--display)',
            fontSize: 'clamp(56px, 10vw, 168px)',
            lineHeight: 0.92,
            letterSpacing: '-0.03em',
            margin: '0 0 36px',
            fontWeight: 400,
          }}
        >
          if your product has a{' '}
          <span
            ref={wordRef}
            style={{
              fontStyle: 'italic',
              display: 'inline-block',
              background: 'linear-gradient(110deg, var(--fire) 0%, var(--gold) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              transition: 'transform 0.18s var(--ease-out)',
            }}
            data-cursor="hover"
          >
            hot loop
          </span>
          <br />
          I want to render it.
        </h2>

        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 19,
            lineHeight: 1.55,
            color: 'var(--paper-dim)',
            maxWidth: '52ch',
            margin: '0 0 56px',
          }}
        >
          Open to full-time and contract frontend roles, remote-friendly. Strongest fit on
          products with real-time data, complex state, or AI orchestration — anywhere the UI
          has to mean something the moment it lands on screen.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            maxWidth: 1100,
          }}
        >
          <a
            href={`mailto:${CONTACT.email}`}
            style={cardStyle}
            data-cursor="hover"
          >
            <span style={cardLbl}>email</span>
            <span style={cardVal}>{CONTACT.email}</span>
            <span style={cardArrow}>↗</span>
          </a>
          <a href={CONTACT.github} target="_blank" rel="noopener noreferrer" style={cardStyle} data-cursor="hover">
            <span style={cardLbl}>github</span>
            <span style={cardVal}>@teoperalez · {26} repos</span>
            <span style={cardArrow}>↗</span>
          </a>
          <a href={CONTACT.site} target="_blank" rel="noopener noreferrer" style={cardStyle} data-cursor="hover">
            <span style={cardLbl}>web</span>
            <span style={cardVal}>teoperalez.com</span>
            <span style={cardArrow}>↗</span>
          </a>
        </div>

        <div
          style={{
            marginTop: 100,
            paddingTop: 28,
            borderTop: '1px solid var(--line-2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--paper-mute)',
          }}
        >
          <span>© 2026 Teo Peralez · hand-built · no framework cult, no analytics</span>
          <span>
            <Link href="/gallery" style={{ color: 'var(--paper-mute)', borderBottom: '1px solid var(--line-2)', paddingBottom: 2 }}>
              gallery — four earlier sketches ↗
            </Link>
          </span>
        </div>
      </div>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '60px 1fr 20px',
  gap: 16,
  alignItems: 'center',
  padding: '22px 24px',
  border: '1px solid var(--line-2)',
  borderRadius: 12,
  background: 'rgba(244,236,220,0.03)',
  transition: 'background 0.2s, border-color 0.2s',
  color: 'var(--paper)',
};
const cardLbl: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--paper-mute)',
};
const cardVal: React.CSSProperties = {
  fontFamily: 'var(--display)',
  fontStyle: 'italic',
  fontSize: 22,
  letterSpacing: '-0.01em',
};
const cardArrow: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  color: 'var(--fire)',
  fontSize: 16,
  textAlign: 'right',
};
