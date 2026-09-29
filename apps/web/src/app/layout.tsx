import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import { AuthProvider } from '@/lib/AuthProvider';
import { Navbar } from '@/components/Navbar';
import './globals.css';
import './map.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
});

export const metadata: Metadata = {
  title: 'ONDIGO, carry it there',
  description:
    'Peer-to-peer delivery: people already driving between cities carry your items, cheaper than shipping.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} font-sans antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
