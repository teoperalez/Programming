import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://teoperalez.com'),
  title: 'Teo Peralez — Frontend Engineer',
  description:
    'Frontend engineer who builds real-time interfaces over live emulator memory, AI pipelines, and solvers. 26 shipped repos.',
  openGraph: {
    title: 'Teo Peralez — Frontend Engineer',
    description: 'Real-time UI over live systems. Pokémon speedrun overlays at 600 Hz, AI video pipelines, emulator hacking.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
