'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Button } from './Button';

export function PhotoUpload({
  deliveryId,
  kind,
  existingPath,
  onUploaded,
}: {
  deliveryId: string;
  kind: 'pickup' | 'dropoff';
  existingPath: string | null;
  onUploaded: (path: string) => void;
}) {
  const client = getSupabaseClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!existingPath) return;
    client.storage
      .from('delivery-photos')
      .createSignedUrl(existingPath, 3600)
      .then(({ data }) => setPreviewUrl(data?.signedUrl ?? null));
  }, [existingPath, client]);

  const handleFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${deliveryId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await client.storage.from('delivery-photos').upload(path, file, { upsert: true });
    setUploading(false);
    if (error) {
      alert(error.message);
      return;
    }
    const { data } = await client.storage.from('delivery-photos').createSignedUrl(path, 3600);
    setPreviewUrl(data?.signedUrl ?? null);
    onUploaded(path);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium capitalize">{kind} photo</p>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={`${kind} verification`} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center border border-dashed border-line text-sm text-muted">
          No photo yet
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Button type="button" variant="secondary" loading={uploading} onClick={() => inputRef.current?.click()}>
        {existingPath ? 'Retake photo' : 'Take / upload photo'}
      </Button>
    </div>
  );
}
