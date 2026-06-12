'use client';

import { useEffect } from 'react';
import s from './styles.module.css';
import type { Project } from '@/lib/projects';
import DamageDemo from './demos/DamageDemo';
import PokerDemo from './demos/PokerDemo';
import MemoryDemo from './demos/MemoryDemo';
import PipelineDemo from './demos/PipelineDemo';
import ExpDemo from './demos/ExpDemo';
import AboutDemo from './demos/AboutDemo';

export type DemoKind = 'damage' | 'poker' | 'memory' | 'pipeline' | 'exp' | 'arch' | 'about';

interface Props {
  kind: DemoKind;
  project: Project;
  onClose: () => void;
}

export default function DemoModal({ kind, project, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className={s.modal}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={s.modalBox} role="dialog" aria-modal="true" aria-label={project.name}>
        <button className={s.modalClose} onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3>{project.name}</h3>
        <p className={s.lede}>★ live demo · all code runs in your browser</p>

        <div className={s.stage}>
          {kind === 'damage' && <DamageDemo />}
          {kind === 'poker' && <PokerDemo />}
          {kind === 'memory' && <MemoryDemo />}
          {kind === 'pipeline' && <PipelineDemo />}
          {kind === 'exp' && <ExpDemo />}
          {(kind === 'arch' || kind === 'about') && <AboutDemo project={project} />}
        </div>
      </div>
    </div>
  );
}
