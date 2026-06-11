import type { Metadata } from 'next';
import Terminal from './Terminal';

export const metadata: Metadata = {
  title: 'teoperalez@portfolio:~$',
  description:
    'Brutalist hacker-terminal portfolio of Teo Peralez — yellow-on-black CRT, live demos (Gen 2 damage calc, Monte-Carlo poker equity, 600 Hz memory poller, 12-step AI video pipeline trace) and a working REPL. Type help.',
};

export default function Page() {
  return <Terminal />;
}
