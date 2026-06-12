'use client';

import styles from './styles.module.css';

/**
 * Fig. 01 — the speedrun-overlay architecture as an annotated print diagram.
 * Emulator (AhShuckie) → memory poller (RBY-GameHook) → Electron overlay →
 * OBS Studio + Mongo Atlas. Ports and the "one overlay, four endpoints"
 * margin note are real.
 */
export default function Diagram() {
  return (
    <aside className={styles.coverDiagram}>
      <div className={styles.diagramLabel}>Fig. 01 — A speedrun overlay, in one diagram</div>
      <svg viewBox="0 0 500 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Architecture diagram: AhShuckie emulator polled by RBY-GameHook, feeding the overlay over websocket, which writes to OBS Studio and Mongo Atlas">
        <defs>
          <marker
            id="quarterly-ar"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#1b1b1b" />
          </marker>
        </defs>

        {/* emulator box */}
        <rect x="20" y="20" width="200" height="80" fill="none" stroke="#1b1b1b" strokeWidth="1.5" />
        <text x="120" y="50" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="18">
          AhShuckie
        </text>
        <text x="120" y="72" textAnchor="middle" fontFamily="Inter" fontSize="10" fill="#6b6b6b">
          rust · 60–600 fps · shared mem
        </text>
        <text x="120" y="90" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#b9351a">
          127.0.0.1:55356
        </text>

        {/* gamehook box */}
        <rect x="280" y="20" width="200" height="80" fill="none" stroke="#1b1b1b" strokeWidth="1.5" />
        <text x="380" y="50" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="18">
          RBY-GameHook
        </text>
        <text x="380" y="72" textAnchor="middle" fontFamily="Inter" fontSize="10" fill="#6b6b6b">
          .net 8 wpf · poller
        </text>
        <text x="380" y="90" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#b9351a">
          localhost:8085
        </text>

        <line x1="220" y1="60" x2="280" y2="60" stroke="#1b1b1b" strokeWidth="1.5" markerEnd="url(#quarterly-ar)" />
        <text x="250" y="52" textAnchor="middle" className={styles.note}>
          poll
        </text>

        {/* overlay */}
        <rect x="100" y="180" width="300" height="120" fill="none" stroke="#1b1b1b" strokeWidth="1.5" />
        <text x="250" y="210" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="22">
          RBY/GSC/RSE NewLayout
        </text>
        <text x="250" y="232" textAnchor="middle" fontFamily="Inter" fontSize="10" fill="#6b6b6b">
          electron · react · canvas
        </text>
        <text x="250" y="252" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#b9351a">
          damage calc · TTKO · tier cards · markers
        </text>
        <text x="250" y="282" textAnchor="middle" fontFamily="Inter" fontSize="10" fill="#6b6b6b">
          listens to GameHook over websocket
        </text>

        <line x1="380" y1="100" x2="280" y2="180" stroke="#1b1b1b" strokeWidth="1.5" markerEnd="url(#quarterly-ar)" />
        <text x="350" y="150" className={styles.note}>
          ws
        </text>

        {/* obs */}
        <rect x="40" y="350" width="180" height="80" fill="none" stroke="#1b1b1b" strokeWidth="1.5" />
        <text x="130" y="380" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="18">
          OBS Studio
        </text>
        <text x="130" y="402" textAnchor="middle" fontFamily="Inter" fontSize="10" fill="#6b6b6b">
          chapter markers · scenes
        </text>

        {/* mongo */}
        <rect x="280" y="350" width="180" height="80" fill="none" stroke="#1b1b1b" strokeWidth="1.5" />
        <text x="370" y="380" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="18">
          Mongo Atlas
        </text>
        <text x="370" y="402" textAnchor="middle" fontFamily="Inter" fontSize="10" fill="#6b6b6b">
          runs · trainers fought · TTKO logs
        </text>

        <line x1="180" y1="300" x2="130" y2="350" stroke="#1b1b1b" strokeWidth="1.5" markerEnd="url(#quarterly-ar)" />
        <line x1="320" y1="300" x2="370" y2="350" stroke="#1b1b1b" strokeWidth="1.5" markerEnd="url(#quarterly-ar)" />

        <text x="250" y="335" textAnchor="middle" className={styles.note}>
          one overlay, four endpoints
        </text>
      </svg>
    </aside>
  );
}
