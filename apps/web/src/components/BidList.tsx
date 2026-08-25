'use client';

import Link from 'next/link';
import type { BidWithDriver } from '@ondigo/shared';
import { Badge } from './Badge';
import { Button } from './Button';
import { DriverBadge } from './DriverBadge';

const statusTone: Record<BidWithDriver['status'], 'default' | 'accent' | 'muted'> = {
  active: 'accent',
  outbid: 'muted',
  accepted: 'default',
  rejected: 'muted',
};

export function BidList({
  bids,
  isOwner,
  onAccept,
}: {
  bids: BidWithDriver[];
  isOwner: boolean;
  onAccept?: (bidId: string) => void;
}) {
  if (bids.length === 0) {
    return <p className="text-sm text-muted">No bids yet — be the first to bid lower.</p>;
  }

  return (
    <ul className="space-y-2">
      {bids.map((bid) => (
        <li key={bid.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3">
          <div className="flex flex-1 items-center gap-3">
            <span className="text-lg font-semibold">${bid.amount.toFixed(2)}</span>
            <Badge tone={statusTone[bid.status]}>{bid.status}</Badge>
          </div>
          {bid.driver && (
            <Link href={`/profile/${bid.driver.id}`} className="hover:underline">
              <DriverBadge driver={bid.driver} size={13} />
            </Link>
          )}
          {isOwner && bid.status === 'active' && onAccept && (
            <Button variant="secondary" onClick={() => onAccept(bid.id)}>
              Accept
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
