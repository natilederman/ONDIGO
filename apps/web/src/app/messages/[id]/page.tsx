'use client';

/** One conversation, with the trip it is about. */
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { tripQueries, tripThreadQueries, type TripThread, type TripWithDriver } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { TripConversation } from '@/components/TripConversation';
import { Notice } from '@/components/Page';

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useRequireAuth();
  const client = getSupabaseClient();
  const [thread, setThread] = useState<TripThread | null | undefined>(undefined);
  const [trip, setTrip] = useState<TripWithDriver | null>(null);
  const [otherName, setOtherName] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const t = await tripThreadQueries.getThread(client, id);
      setThread(t);
      if (!t) return;
      const tr = await tripQueries.getTrip(client, t.trip_id);
      setTrip(tr);
      const others = await tripThreadQueries.myThreads(client);
      setOtherName(others.find((x) => x.id === id)?.other_name ?? '');
    })().catch(() => setThread(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  if (authLoading || !user || thread === undefined) return null;
  if (!thread) return <Notice>This conversation is not available.</Notice>;

  const asMember = thread.member_id === user.id;
  const otherId = asMember ? thread.driver_id : thread.member_id;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/messages" className="text-[13px] font-medium text-muted hover:text-ink">&#8592; All messages</Link>
      <div className="mt-3 flex flex-col gap-1 border-b-2 border-ink pb-4">
        <h1 className="text-[clamp(1.35rem,2.2vw,1.75rem)] font-semibold leading-tight tracking-display">{otherName || 'Conversation'}</h1>
        {trip && (
          <p className="text-[14px] text-muted">
            {asMember ? 'Driving' : 'About your trip'}: {trip.origin_text} <span aria-hidden>&#8594;</span> {trip.destination_text}.{' '}
            <Link href={`/trips/${trip.id}`} className="font-medium text-ink underline">View trip</Link>
          </p>
        )}
      </div>
      <div className="mt-5">
        {otherName && (
          <TripConversation
            tripId={thread.trip_id}
            threadId={thread.id}
            me={user.id}
            otherId={otherId}
            otherName={otherName}
            asMember={asMember}
          />
        )}
      </div>
    </div>
  );
}
