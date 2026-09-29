/**
 * What was checked about a driver, and when. Never the word "verified" on its
 * own: the sentence names each check and its date, and says plainly when the
 * record came from the demo seed rather than from a check that ran.
 */
import type { DriverPublicTrust } from '@ondigo/shared';

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

export function trustSentence(t: DriverPublicTrust | null | undefined): string {
  if (!t) return 'No checks on record.';
  const parts: string[] = [];
  const id = day(t.identity_checked_at);
  if (id && t.liveness_checked_at) parts.push(`ID and selfie checked ${id}`);
  else if (id) parts.push(`ID checked ${id}`);
  const lic = day(t.licence_checked_at);
  if (lic && t.insurance_checked_at && t.vehicle_checked_at) parts.push(`licence, insurance and ${t.vehicle_classes?.replace(',', ' and ') ?? 'vehicle'} on file since ${lic}`);
  const rec = day(t.records_checked_at);
  if (rec) parts.push(`records check ${rec}${t.driving_record_checked_at ? ', driving record too' : ''}`);
  if (!parts.length) return 'No checks on record.';
  let s = parts.join('. ') + '.';
  if (!rec) s += ' No criminal records search.';
  if ((t.providers ?? '').split(',').includes('demo')) s += ' Demo account: these are seed records, no document was checked.';
  return s;
}

export function TrustLine({ trust, className = '' }: { trust: DriverPublicTrust | null | undefined; className?: string }) {
  return <p className={`text-[12px] leading-snug text-steel ${className}`}>{trustSentence(trust)}</p>;
}
