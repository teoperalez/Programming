import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Teo Peralez — Frontend Engineer',
  description:
    'Four-version interactive portfolio. Pokémon speedrun overlays, emulator memory pollers, AI video pipelines, solvers — with live demos in every version.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
