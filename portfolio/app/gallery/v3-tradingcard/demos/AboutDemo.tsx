'use client';

import type { Project } from '@/lib/projects';

interface Props {
  project: Project;
}

export default function AboutDemo({ project }: Props) {
  return (
    <div
      style={{
        padding: 16,
        background: '#fff',
        border: '2px solid #1a1a1a',
        borderRadius: 10,
        color: '#1a1a1a',
      }}
    >
      <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5 }}>{project.story}</p>
      <ul style={{ margin: '0 0 14px', paddingLeft: 18, fontSize: 13, lineHeight: 1.55 }}>
        {project.highlights.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
      {project.artifacts && project.artifacts.length > 0 && (
        <p
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: '#6b6675',
            margin: '0 0 12px',
          }}
        >
          ENDPOINTS · {project.artifacts.join(' · ')}
        </p>
      )}
      <p
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: '#6b6675',
          margin: 0,
        }}
      >
        STACK · {project.stack.join(' · ')}
      </p>
      <a
        style={{
          display: 'inline-block',
          marginTop: 16,
          padding: '8px 14px',
          background: '#1a1a1a',
          color: '#ffcb05',
          textDecoration: 'none',
          borderRadius: 999,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
        }}
        href={`https://github.com/teoperalez/${project.slug}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        ↗ view on github
      </a>
    </div>
  );
}
