import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/AuthProvider';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ONDIGO — carry it there',
  description: 'Peer-to-peer delivery: people already driving between cities carry your items, cheaper than shipping.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
