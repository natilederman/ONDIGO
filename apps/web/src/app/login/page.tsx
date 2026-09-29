'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInSchema } from '@ondigo/shared';
import { useAuth } from '@/lib/AuthProvider';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      router.push('/requests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[380px] py-6">
      <h1 className="text-[clamp(1.5rem,2.4vw,1.95rem)] font-semibold leading-[1.1] tracking-display">
        Log in
      </h1>

      <form onSubmit={submit} className="mt-8 space-y-5 border-t border-ink pt-7">
        <Input
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="border-l-2 border-signal pl-3 text-sm text-signal">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        No account?{' '}
        <Link href="/signup" className="font-medium text-ink underline">
          Sign up
        </Link>
      </p>

      <div className="mt-10 border-t border-line pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
          Demo accounts
        </p>
        <ul className="mt-3 space-y-1.5">
          {['alice@ondigo.test', 'ben@ondigo.test', 'carla@ondigo.test', 'drew@ondigo.test'].map(
            (addr) => (
              <li key={addr} className="flex items-baseline justify-between gap-4 text-[13px]">
                <span className="text-muted">{addr}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(addr);
                    setPassword('ondigo123');
                  }}
                  className="shrink-0 text-steel underline transition-colors duration-150 hover:text-ink"
                >
                  Use
                </button>
              </li>
            )
          )}
        </ul>
        <p className="mt-3 text-[12px] text-steel">Password for all four: ondigo123</p>
      </div>
    </div>
  );
}
