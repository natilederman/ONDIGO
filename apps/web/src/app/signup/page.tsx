'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpSchema, VEHICLE_TYPES, type VehicleType } from '@ondigo/shared';
import { useAuth } from '@/lib/AuthProvider';
import { Card } from '@/components/Card';
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
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <Card className="mt-6">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Select
            label="Vehicle (optional — set this if you plan to drive)"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
          >
            <option value="">No vehicle / sender only</option>
            {VEHICLE_TYPES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label} — up to {v.maxWeightKg}kg
              </option>
            ))}
          </Select>
          {error && <p className="text-sm text-accent-dark">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Sign up
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account? <Link href="/login" className="font-medium text-ink underline">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
