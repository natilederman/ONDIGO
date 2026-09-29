'use client';

/**
 * Deliveries on a profile. On your own profile: what is in progress, with a
 * way into each one. On anyone's: the deliveries they completed, city to
 * city, with the rating they received. The public half never shows a street,
 * an item or a price; ends are snapped to the nearest known city like the map.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { deliveryQueries, ITEM_CATEGORIES, type MyDeliveryRow, type PublicDeliveryRecord } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { loadMapData, snap } from '@/lib/map/data';
import { StarRating } from './StarRating';

const LABEL = 'text-[11px] font-semibold uppercase tracking-[0.1em] text-steel';
const ARROW = <span aria-hidden className="mx-1.5 font-normal text-steel">&#8594;</span>;
const SETTLED = new Set(['completed', 'disputed']);
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

type Snapped = PublicDeliveryRecord & { from: string; to: string };

export function ProfileDeliveries({ userId, isSelf, firstName }: { userId: string; isSelf: boolean; firstName: string }) {
  const client = getSupabaseClient();
  const [mine, setMine] = useState<MyDeliveryRow[] | null>(null);
  const [record, setRecord] = useState<Snapped[] | null>(null);

  useEffect(() => {
    let alive = true;
    if (isSelf) deliveryQueries.listMyDeliveriesWithRoute(client, userId).then((d) => alive && setMine(d)).catch(() => alive && setMine([]));
    Promise.all([deliveryQueries.publicDeliveryRecord(client, userId), loadMapData()])
      .then(([rows, map]) => {
        if (!alive) return;
        setRecord(
          rows.map((r) => {
            const a = snap(map.cities, Number(r.plat), Number(r.plng));
            const b = snap(map.cities, Number(r.dlat), Number(r.dlng));
            return { ...r, from: `${a.city}, ${a.state}`, to: `${b.city}, ${b.state}` };
          })
        );
      })
      .catch(() => alive && setRecord([]));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isSelf]);

  const active = (mine ?? []).filter((d) => !SETTLED.has(d.status));
  const carried = (record ?? []).filter((r) => r.role === 'carried');
  const sent = (record ?? []).filter((r) => r.role === 'sent');

  return (
    <section className="space-y-8">
      {isSelf && (
        <div>
          <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-2.5">
            <h2 className="text-[15px] font-semibold">In progress</h2>
            <Link href="/deliveries" className="text-[12.5px] text-muted underline">All your deliveries</Link>
          </div>
          {mine === null ? (
            <p className="py-4 text-sm text-steel">Loading…</p>
          ) : active.length === 0 ? (
            <p className="py-4 text-sm text-muted">Nothing in progress right now.</p>
          ) : (
            active.map((d) => (
              <Link key={d.id} href={`/deliveries/${d.id}`} className="row-wash block border-b-2 border-ink px-1 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="text-[clamp(1.02rem,1.5vw,1.2rem)] font-semibold leading-[1.15] tracking-display">
                    {d.request ? <>{d.request.pickup_text}{ARROW}{d.request.dropoff_text}</> : 'Delivery'}
                  </div>
                  <div className="tnum shrink-0 text-right font-semibold">${d.agreed_price.toFixed(2)}</div>
                </div>
                <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[13px] text-muted">
                  <span>{d.driver_id === userId ? 'You are carrying' : 'Being carried for you'}{d.request ? ` · ${d.request.item_description}` : ''}</span>
                  <span className={LABEL}>{d.status.replace(/_/g, ' ')}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      <div>
        <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-2.5">
          <h2 className="text-[15px] font-semibold">{isSelf ? 'Your track record' : 'Deliveries completed'}</h2>
          {record && record.length > 0 && (
            <span className="text-[12.5px] text-steel">
              {carried.length} carried · {sent.length} sent
            </span>
          )}
        </div>
        {record === null ? (
          <p className="py-4 text-sm text-steel">Loading…</p>
        ) : record.length === 0 ? (
          <p className="py-4 text-sm text-muted">{isSelf ? 'No completed deliveries yet.' : `${firstName} has not completed a delivery yet.`}</p>
        ) : (
          <ul>
            {record.map((r) => (
              <li key={r.delivery_id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 border-b border-line px-1 py-3.5">
                <div className="text-[15px] font-semibold tracking-[-0.01em]">
                  {r.from}{ARROW}{r.to}
                </div>
                <div className="flex items-center justify-end gap-1.5 text-[12.5px] text-steel">
                  {r.rating ? <StarRating value={r.rating} readOnly size={13} /> : <span>Not rated</span>}
                </div>
                <div className="text-[12.5px] text-steel">
                  {r.role === 'carried' ? 'Carried' : 'Sent'}
                  {r.category ? ` · ${ITEM_CATEGORIES.find((c) => c.value === r.category)?.label ?? ''}` : ''}
                </div>
                <div className="text-right text-[12.5px] text-steel">{day(r.completed_at)}</div>
              </li>
            ))}
          </ul>
        )}
        {!isSelf && record && record.length > 0 && (
          <p className="mt-3 text-[12px] leading-relaxed text-steel">City to city only. Street addresses, items and prices stay between the people involved.</p>
        )}
      </div>
    </section>
  );
}
