'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpSchema, VEHICLE_TYPES, type VehicleType } from '@ondigo/shared';
import { useAuth } from '@/lib/AuthProvider';
import { Input, Select } from '@/components/Input';
import { Button } from '@/components/Button';

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({
      fullName,
      email,
      password,
      vehicleType: vehicleType || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUp(email, password, fullName, vehicleType || undefined);
      router.push('/requests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[380px] py-6">
      <h1 className="text-[clamp(1.5rem,2.4vw,1.95rem)] font-semibold leading-[1.1] tracking-display">
        Create your account
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        One account covers both sides. You can send things, drive, or do both.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5 border-t border-ink pt-7">
        <Input
          id="signup-name"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          id="signup-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="signup-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Select
          id="signup-vehicle"
          label="Vehicle"
          hint="Only needed if you plan to carry things for other people."
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
        >
          <option value="">No vehicle, sender only</option>
          {VEHICLE_TYPES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}, up to {v.maxWeightKg}kg
            </option>
          ))}
        </Select>

        {error && (
          <p role="alert" className="border-l-2 border-signal pl-3 text-sm text-signal">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Sign up
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-ink underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
