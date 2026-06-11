'use client';

import { useEffect, useState } from 'react';
import s from '../styles.module.css';
import { PIPELINE_STEPS } from '@/lib/projects';

const STEP_MS = 600;
const GATE_STEP = 9;
const AUDIT_STEP = 7;

interface RunState {
  active: boolean;
  /** 0 = not started; 1..12 = currently-lit step */
  step: number;
  /** paused at the approval gate, waiting for a verdict */
  gate: boolean;
  done: boolean;
  rejects: number;
  note: string;
}

const IDLE: RunState = {
  active: false,
  step: 0,
  gate: false,
  done: false,
  rejects: 0,
  note: 'idle — press run to walk the real Hyperframes flow',
};

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function Pipeline() {
  const [run, setRun] = useState<RunState>(IDLE);

  // step the highlight every ~600 ms while a run is active and not gated
  useEffect(() => {
    if (!run.active || run.gate || run.done) return;
    const t = setTimeout(() => {
      setRun((r) => {
        if (!r.active || r.gate || r.done) return r;
        if (r.step >= PIPELINE_STEPS.length) {
          return { ...r, active: false, done: true, note: 'done — final.mov ready, 4-track FCPXML handed to Resolve' };
        }
        const next = r.step + 1;
        const st = PIPELINE_STEPS[next - 1];
        if (next === GATE_STEP) {
          return { ...r, step: next, gate: true, note: 'paused at the approval gate — every audited line needs a verdict' };
        }
        return { ...r, step: next, note: `running ${pad2(st.n)} ${st.name} → ${st.out}` };
      });
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [run]);

  const start = () =>
    setRun({ active: true, step: 0, gate: false, done: false, rejects: 0, note: 'starting…' });

  const approve = () =>
    setRun((r) => ({ ...r, gate: false, note: 'lines approved — render unblocked' }));

  // rejected lines block render: loop back to step 7 (audit + clip map)
  const reject = () =>
    setRun((r) => ({
      ...r,
      gate: false,
      step: AUDIT_STEP,
      rejects: r.rejects + 1,
      note: `line rejected — looped back to ${pad2(AUDIT_STEP)} audit (rejected lines block render)`,
    }));

  return (
    <div>
      <div className={s.pipeHead}>
        <span className={s.pipeTitle}>IRLPC Hyperframes · the real 12-step pipeline</span>
        <button type="button" className={s.runBtn} onClick={start} disabled={run.active}>
          {run.active ? 'running…' : run.done ? '▶ run again' : '▶ run'}
        </button>
      </div>
      <div className={s.pipeStatus}>
        {run.note}
        {run.rejects > 0 ? ` · rejections: ${run.rejects}` : ''}
      </div>

      <div className={s.pipeFlow}>
        {PIPELINE_STEPS.map((st) => {
          const isDone = run.done || run.step > st.n;
          const isActive = run.active && run.step === st.n;
          return (
            <div key={st.n}>
              <div className={`${s.pipeNode} ${isDone ? s.nodeDone : ''} ${isActive ? s.nodeActive : ''}`}>
                <div className={s.nodeNum}>{isDone ? '✓' : pad2(st.n)}</div>
                <div className={s.nodeBody}>
                  <div className={s.nodeName}>
                    {pad2(st.n)} {st.name}
                  </div>
                  <div className={s.nodeTool}>{st.tool}</div>
                  <div className={s.nodeOut}>→ {st.out}</div>
                </div>
              </div>
              {st.n === GATE_STEP && run.gate && (
                <div className={s.gate}>
                  <div className={s.gateText}>
                    Human gate @ localhost:5173 — approve the audited lines, or reject and loop back to{' '}
                    {pad2(AUDIT_STEP)} audit + clip map.
                  </div>
                  <div className={s.gateBtns}>
                    <button type="button" className={s.approve} onClick={approve}>
                      ✓ Approve
                    </button>
                    <button type="button" className={s.reject} onClick={reject}>
                      ✗ Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
