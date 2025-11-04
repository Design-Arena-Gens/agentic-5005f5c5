export const metadata = {
  title: 'Sector Megatrend Radar',
  description: 'Semi-circular radar for sector megatrends',
};

import './globals.css';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="container py-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Radar demi-cercle des m?ga-tendances par secteur</h1>
            <p className="text-muted mt-1">Donn?es fictives, pond?r?es par maturit? et investissements</p>
          </header>
          {children}
          <footer className="mt-12 text-sm text-muted/80">
            ? 2025 Megatrend Radar (demo)
          </footer>
        </div>
      </body>
    </html>
  );
}
