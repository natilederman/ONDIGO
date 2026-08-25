'use client';

import { useState } from 'react';
import { panicQueries, EMERGENCY_CONTACT } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Button } from './Button';

export function PanicButton({ deliveryId }: { deliveryId: string | null }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const client = getSupabaseClient();

  const trigger = () => {
    setOpen(true);
    setSending(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await panicQueries.triggerPanicAlert(client, deliveryId, pos.coords.latitude, pos.coords.longitude);
        setSending(false);
        setSent(true);
      },
      async () => {
        await panicQueries.triggerPanicAlert(client, deliveryId, null, null);
        setSending(false);
        setSent(true);
      }
    );
  };

  return (
    <>
      <button
        onClick={trigger}
        className="inline-flex items-center gap-2 rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent-dark hover:bg-accent hover:text-paper"
      >
        Panic button
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-card bg-paper p-6 text-center">
            <h3 className="text-lg font-semibold">
              {sending ? 'Sending your location…' : 'Alert logged'}
            </h3>
            <p className="mt-2 text-sm text-muted">{EMERGENCY_CONTACT.note}</p>
            <a
              href={`tel:${EMERGENCY_CONTACT.phone}`}
              className="mt-4 block rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-paper"
            >
              Call {EMERGENCY_CONTACT.label}
            </a>
            <Button variant="ghost" className="mt-3 w-full" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
