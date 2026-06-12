'use client';

import { useEffect, useRef, useState } from 'react';
import { PIPELINE_STEPS } from '@/lib/projects';

/**
 * 12-step Hyperframes pipeline rendered as a vertical orchestrated flow.
 * On scroll-into-view, each step lights up in sequence (the "pipeline run"),
 * pauses at step 9 (approval gate) for half a second, then completes.
 * On click, jumps back to step 1 and replays.
 */
export default function PipelineViz() {
  const [active, setActive] = useState(-1);
  const [running, setRunning] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !running) {
            run();
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(root);
    return () => io.disconnect();
    // run() captures setRunning/setActive — fine; we only need a one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = () => {
    setRunning(true);
    setActive(-1);
    let i = 0;
    const tick = () => {
      setActive(i);
      i++;
      if (i < PIPELINE_STEPS.length) {
        const delay = i === 9 ? 1100 : 420;
        setTimeout(tick, delay);
      } else {
        setTimeout(() => setRunning(false), 600);
      }
    };
    setTimeout(tick, 250);
  };

  return (
    <div
      ref={rootRef}
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 12,
      }}
      onClick={() => {
        if (!running) run();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !running) run();
      }}
      title="click to replay"
    >
      {PIPELINE_STEPS.map((step, i) => {
        const isActive = i === active;
        const done = i < active;
        const pending = i > active;
        return (
          <div
            key={step.n}
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr auto',
              gap: 14,
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px dashed var(--line)',
              opacity: pending ? 0.32 : 1,
              transition: 'opacity 0.4s var(--ease-out), color 0.3s',
              color: isActive ? 'var(--paper)' : 'var(--paper-dim)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: isActive ? 'var(--fire)' : done ? 'var(--gold)' : 'var(--paper-mute)',
                letterSpacing: '0.1em',
                position: 'relative',
              }}
            >
              {String(step.n).padStart(2, '0')}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    left: -10,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: 'var(--fire)',
                    boxShadow: '0 0 12px var(--fire)',
                  }}
                />
              )}
            </span>
            <span>
              <span style={{ fontFamily: 'var(--display)', fontStyle: 'italic', fontSize: 16, marginRight: 10, color: 'var(--paper)' }}>
                {step.name}
              </span>
              <span style={{ color: 'var(--paper-mute)' }}>— {step.tool}</span>
              {i === 9 && isActive && (
                <span style={{ marginLeft: 10, color: 'var(--gold)', fontStyle: 'italic' }}>
                  waiting for human approval…
                </span>
              )}
            </span>
            <span style={{ color: 'var(--plasma)', fontSize: 11, whiteSpace: 'nowrap' }}>{step.out}</span>
          </div>
        );
      })}
      <div
        style={{
          marginTop: 16,
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--paper-mute)',
          textAlign: 'right',
        }}
      >
        {running ? 'running…' : '↻ click to replay'}
      </div>
    </div>
  );
}
