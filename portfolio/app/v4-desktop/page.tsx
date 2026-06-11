import type { Metadata } from 'next';
import Desktop from './Desktop';

export const metadata: Metadata = {
  title: 'teoOS — desktop',
  description:
    'A macOS-style desktop portfolio: draggable windows, a dock, a working terminal, a Gen 2 damage calculator, and a 12-step pipeline visualizer over 26 real repos.',
};

export default function Page() {
  return <Desktop />;
}
