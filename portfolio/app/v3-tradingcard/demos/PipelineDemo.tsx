'use client';

import { useState } from 'react';
import s from '../styles.module.css';
import { PIPELINE_STEPS } from '@/lib/projects';

export default function PipelineDemo() {
  const [active, setActive] = useState<number>(0);
  const step = PIPELINE_STEPS[active];

  return (
    <>
      <p
        style={{
          fontFamily: 'var(--pixel)',
          fontSize: '9px',
          color: '#6b6675',
          margin: '6px 0 10px',
        }}
      >
        ▼ 12-step LLM pipeline · tap a step
      </p>
      <div className={s.flowGrid}>
        {PIPELINE_STEPS.map((st, i) => (
          <button
            key={st.n}
            className={i === active ? s.active : ''}
            onClick={() => setActive(i)}
          >
            {String(st.n).padStart(2, '0')} {st.name}
          </button>
        ))}
      </div>
      <div className={s.out}>
        STEP {String(step.n).padStart(2, '0')} ▸ {step.name.toUpperCase()}
        <br />
        TOOL ▸ {step.tool}
        <br />
        OUTPUT ▸ {step.out}
      </div>
    </>
  );
}
