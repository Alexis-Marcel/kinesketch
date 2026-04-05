import type { Metadata } from 'next';
import { AuthProvider } from '../auth/AuthProvider';
import '../index.css';
import './auth.css';

export const metadata: Metadata = {
  title: 'KineSketch',
  description: 'Outil de dessin de schémas cinématiques ISO 3952',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
