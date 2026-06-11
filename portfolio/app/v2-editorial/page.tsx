import type { Metadata } from 'next';
import Quarterly from './Quarterly';

export const metadata: Metadata = {
  title: 'The Peralez Quarterly — Issue 01',
  description:
    'A quiet-luxury print-magazine portfolio: 26 dispatches, an interactive damage-calculator specimen, annotated architecture diagrams, and two postmortems filed from production.',
};

export default function Page() {
  return <Quarterly />;
}
