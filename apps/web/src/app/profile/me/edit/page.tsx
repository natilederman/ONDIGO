'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { profileQueries, profileEditSchema, VEHICLE_TYPES, type VehicleType } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useAuth } from '@/lib/AuthProvider';
import { Card } from '@/components/Card';
import { Input, Select, Textarea } from '@/components/Input';
import { Button } from '@/components/Button';

export default function EditProfilePage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { profile, refreshProfile } = useAuth();
  const client = getSupabaseClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setBio(profile.bio ?? '');
    setVehicleType(profile.vehicle_type ?? '');
    setAvatarUrl(profile.avatar_url);
  }, [profile]);

  if (authLoading || !user) return null;

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = profileQueries.avatarPath(user.id, ext);
    const { error: uploadError } = await client.storage.from('avatars').upload(path, file, { upsert: true });
    setUploading(false);
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    const { data } = client.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    await profileQueries.updateProfile(client, user.id, { avatar_url: data.publicUrl });
    await refreshProfile();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileEditSchema.safeParse({ fullName, bio, vehicleType: vehicleType || undefined });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await profileQueries.updateProfile(client, user.id, {
        full_name: parsed.data.fullName,
        bio: parsed.data.bio ?? null,
        vehicle_type: parsed.data.vehicleType ?? null,
      });
      await refreshProfile();
      router.push(`/profile/${user.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Edit profile</h1>
      <Card className="mt-6 space-y-4">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-line" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
          />
          <Button type="button" variant="secondary" loading={uploading} onClick={() => fileRef.current?.click()}>
            Change photo
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          <Select
            label="Vehicle"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
          >
            <option value="">No vehicle / sender only</option>
            {VEHICLE_TYPES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </Select>
          {error && <p className="text-sm text-signal">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Save
          </Button>
        </form>
      </Card>
    </div>
  );
}
