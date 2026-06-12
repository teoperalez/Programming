import type { Metadata } from 'next';
import Link from 'next/link';
import Chooser from './chooser/page';

export const metadata: Metadata = {
  title: 'Gallery — Teo Peralez',
  description: 'Four stylistic exercises that became the foundation for the main portfolio.',
};

export default function Gallery() {
  return (
    <div>
      <div
        style={{
          position: 'fixed',
          top: 14,
          left: 14,
          zIndex: 100,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 11,
          color: '#aaa3b1',
          background: 'rgba(0,0,0,0.6)',
          padding: '6px 10px',
          borderRadius: 6,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Link href="/" style={{ color: '#ffd24c', textDecoration: 'none' }}>
          ← back to portfolio
        </Link>
        <span style={{ marginLeft: 10 }}>gallery · stylistic exercises</span>
      </div>
      <Chooser />
    </div>
  );
}
