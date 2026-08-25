'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInSchema } from '@ondigo/shared';
import { useAuth } from '@/lib/AuthProvider';
import { Card } from '@/components/Card';
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
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Log in</h1>
      <Card className="mt-6 space-y-4">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-accent-dark">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Log in
          </Button>
        </form>
        <p className="text-center text-sm text-muted">
          No account? <Link href="/signup" className="font-medium text-ink underline">Sign up</Link>
        </p>
        <p className="text-center text-xs text-muted">
          Demo accounts: alice@ondigo.test / ben@ondigo.test / carla@ondigo.test / drew@ondigo.test — password
          ondigo123
        </p>
      </Card>
    </div>
  );
}
