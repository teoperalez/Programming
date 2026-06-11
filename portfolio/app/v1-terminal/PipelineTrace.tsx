'use client';

import { useEffect, useRef, useState } from 'react';
import { PIPELINE_STEPS } from '@/lib/projects';
import styles from './styles.module.css';

const STEP_MS = 320;

export default function PipelineTrace() {
  const [shown, setShown] = useState(0);
  const preRef = useRef<HTMLPreElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = preRef.current;
    if (!node) return;

    let timer: number | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            io.disconnect();
            let count = 0;
            timer = window.setInterval(() => {
              count++;
              setShown(Math.min(count, PIPELINE_STEPS.length));
              if (count >= PIPELINE_STEPS.length && timer !== null) {
                clearInterval(timer);
                timer = null;
              }
            }, STEP_MS);
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(node);

    return () => {
      io.disconnect();
      if (timer !== null) clearInterval(timer);
    };
  }, []);

  const lines = PIPELINE_STEPS.slice(0, shown).map(
    (s) => `${String(s.n).padStart(2, '0')}  ${s.name.padEnd(18)} ── ${s.tool}  →  ${s.out}`,
  );

  return (
    <pre ref={preRef} className={styles.flow}>
      {lines.join('\n')}
    </pre>
  );
}
