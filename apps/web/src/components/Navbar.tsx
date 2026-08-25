'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';

const links = [
  { href: '/trips', label: 'Trips' },
  { href: '/requests', label: 'Requests' },
  { href: '/deliveries', label: 'Deliveries' },
];

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ONDIGO
        </Link>
        {user && (
          <nav className="hidden gap-6 sm:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium ${
                  pathname?.startsWith(l.href) ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href={`/profile/${user.id}`} className="text-sm font-medium hover:underline">
                {profile?.full_name ?? 'Profile'}
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  router.push('/');
                }}
                className="text-sm text-muted hover:text-ink"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-muted hover:text-ink">
                Log in
              </Link>
              <Link href="/signup" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
