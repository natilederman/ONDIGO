'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { verificationQueries, type BidWithDriver, type DriverPublicTrust } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Button } from './Button';
import { DriverBadge } from './DriverBadge';
import { TrustLine } from './TrustLine';

/**
 * The bid ladder. The standing bid keeps full weight and a solid rule beneath it;
 * beaten bids are struck through and dimmed, so the ladder reads without colour.
 */
export function BidList({
  bids,
  isOwner,
  onAccept,
}: {
  bids: BidWithDriver[];
  isOwner: boolean;
  onAccept?: (bidId: string) => void;
}) {
  const [trust, setTrust] = useState<Record<string, DriverPublicTrust>>({});
  useEffect(() => {
    const ids = Array.from(new Set(bids.map((b) => b.driver?.id).filter(Boolean))) as string[];
    if (!ids.length) return;
    verificationQueries.publicTrust(getSupabaseClient(), ids).then(setTrust).catch(() => {});
  }, [bids]);

  if (bids.length === 0) {
    return (
      <p className="border-t border-line pt-5 text-sm text-muted">
        No bids yet. The first driver to bid sets the price to beat.
      </p>
    );
  }

  return (
    <ul className="border-t border-ink">
      {bids.map((bid) => {
        const beaten = bid.status === 'outbid' || bid.status === 'rejected';
        const standing = bid.status === 'active' || bid.status === 'accepted';
        return (
          <li
            key={bid.id}
            className={`land flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2 px-0.5 py-4 ${
              bid.status === 'accepted' ? 'border-b-2 border-ink' : 'border-b border-line'
            }`}
          >
            <div className={`min-w-0 flex-1 ${beaten ? 'opacity-45' : ''}`}>
              {bid.driver ? (
                <Link href={`/profile/${bid.driver.id}`} className="hover:underline">
                  <DriverBadge driver={bid.driver} size={13} />
                </Link>
              ) : (
                <span className="text-sm text-steel">Driver</span>
              )}
              {bid.driver && <TrustLine trust={trust[bid.driver.id]} className="mt-1 max-w-[52ch]" />}
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">
                {bid.status}
              </span>
            </div>

            <span
              className={`tnum font-semibold tracking-display ${
                standing ? 'text-[clamp(1.3rem,2vw,1.7rem)]' : 'text-[1.15rem] opacity-45 line-through'
              }`}
            >
              ${bid.amount.toFixed(2)}
            </span>

            {isOwner && bid.status === 'active' && onAccept && (
              <Button variant="secondary" onClick={() => onAccept(bid.id)}>
                Accept
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
