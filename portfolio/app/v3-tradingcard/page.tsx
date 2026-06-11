import type { Metadata } from 'next';
import Binder from './Binder';

export const metadata: Metadata = {
  title: 'Teo Peralez — Trainer Card Binder',
  description:
    "A Pokémon-style trading-card binder of 26 shipped projects. Flip a card, play the demo.",
};

export default function Page() {
  return <Binder />;
}
