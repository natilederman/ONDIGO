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
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="text-[15px] font-bold tracking-[0.18em] whitespace-nowrap">
          ONDIGO
        </Link>

        {user && (
          <nav className="hidden gap-7 sm:flex">
            {links.map((l) => {
              const active = pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-[13.5px] font-medium transition-colors duration-150 ${
                    active ? 'text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-5">
          {user ? (
            <>
              <Link
                href={`/profile/${user.id}`}
                className="text-[13.5px] font-medium hover:underline"
              >
                {profile?.full_name ?? 'Profile'}
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  router.push('/');
                }}
                className="text-[13.5px] text-muted transition-colors duration-150 hover:text-ink"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[13.5px] font-medium text-muted transition-colors duration-150 hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full border border-ink bg-ink px-4 py-2 text-[13.5px] font-semibold text-paper transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
