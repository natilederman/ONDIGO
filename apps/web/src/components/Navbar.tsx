'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';

const links = [
  { href: '/trips', label: 'Trips' },
  { href: '/requests', label: 'Requests' },
  { href: '/deliveries', label: 'Deliveries' },
  { href: '/verify', label: 'Get ready to carry' },
];

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // the phone menu closes on navigation, on Escape, and on a tap anywhere else
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const doSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const row = 'flex items-center justify-between border-b border-line px-6 py-4 text-[16px] font-medium';

  return (
    <header ref={menuRef} className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-3">
          {/* phones: the menu sits left of the mark and skips the map entirely */}
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="phone-menu"
            onClick={() => setOpen((o) => !o)}
            className="-ml-2 flex h-10 w-10 flex-col items-center justify-center gap-[5px] sm:hidden"
          >
            <span className={`block h-px w-[18px] bg-ink transition-transform duration-200 ease-out ${open ? 'translate-y-[6px] rotate-45' : ''}`} />
            <span className={`block h-px w-[18px] bg-ink transition-opacity duration-150 ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-px w-[18px] bg-ink transition-transform duration-200 ease-out ${open ? '-translate-y-[6px] -rotate-45' : ''}`} />
          </button>
          <Link href="/" className="text-[15px] font-bold tracking-[0.18em] whitespace-nowrap">
            ONDIGO
          </Link>
          {/* the whole site is a demonstration; say so where every page can see it */}
          <span
            title="Demo, not a working service"
            className="ml-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.1em] text-signal sm:ml-2"
          >
            <span className="sm:hidden">Demo</span>
            <span className="hidden sm:inline">Demo, not a working service</span>
          </span>
        </div>

        {user && (
          <nav className="hidden gap-7 sm:flex">
            {[...links, ...(profile?.is_admin ? [{ href: '/admin/verifications', label: 'Review queue' }] : [])].map((l) => {
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
              <Link href={`/profile/${user.id}`} className="hidden text-[13.5px] font-medium hover:underline sm:inline">
                {profile?.full_name ?? 'Profile'}
              </Link>
              {/* on phones Sign out lives in the menu, where there is room for it */}
              <button onClick={doSignOut} className="hidden text-[13.5px] text-muted transition-colors duration-150 hover:text-ink sm:inline">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[13.5px] font-medium text-muted transition-colors duration-150 hover:text-ink">
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

      {/* the dropdown: a sheet of hairline rows under the header, phones only */}
      <div
        id="phone-menu"
        hidden={!open}
        className="absolute inset-x-0 top-16 border-b border-ink bg-paper shadow-[0_24px_40px_-24px_rgba(0,0,0,0.25)] sm:hidden"
      >
        <nav aria-label="Main">
          {[...links, ...(profile?.is_admin ? [{ href: '/admin/verifications', label: 'Review queue' }] : [])].map((l) => {
            const active = pathname?.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined} className={row}>
                <span>{l.label}</span>
                {active && <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">Here</span>}
              </Link>
            );
          })}
          <Link href="/requests/new" className={`${row} border-t-2 border-t-ink`}>
            <span>Post a request</span>
            <span aria-hidden className="text-steel">&#8594;</span>
          </Link>
          <Link href="/trips/new" className={row}>
            <span>Post a trip</span>
            <span aria-hidden className="text-steel">&#8594;</span>
          </Link>
          {user ? (
            <>
              <Link href={`/profile/${user.id}`} className={`${row} border-t-2 border-t-ink`}>
                <span>{profile?.full_name ?? 'Profile'}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">Profile</span>
              </Link>
              <button type="button" onClick={doSignOut} className={`${row} w-full text-left text-muted`}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={`${row} border-t-2 border-t-ink`}>
                <span>Log in</span>
              </Link>
              <Link href="/signup" className={row}>
                <span>Create an account</span>
                <span aria-hidden className="text-steel">&#8594;</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
