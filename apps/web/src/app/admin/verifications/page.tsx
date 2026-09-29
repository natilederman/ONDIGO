'use client';

/**
 * The review queue. A reviewer sees what was submitted, looks at the images
 * through short-lived signed links, and writes a decision in words the person
 * will read. Rejections need a reason; nothing is decided silently.
 */
import { useCallback, useEffect, useState } from 'react';
import { verificationQueries, type QueueItem, type VerificationStatus } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useAuth } from '@/lib/AuthProvider';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Input';

const KIND_LABEL: Record<string, string> = {
  identity_document: 'ID document', liveness: 'Selfie', driving_licence: 'Driving licence', insurance: 'Insurance',
  vehicle: 'Vehicle', phone: 'Phone', criminal_records: 'Criminal records', motor_vehicle_record: 'Driving record', payout_account: 'Payout account',
};
const EXPIRY_MONTHS: Record<string, number> = { identity_document: 24, liveness: 6, driving_licence: 24, insurance: 6, vehicle: 12 };

function Item({ item, onDone }: { item: QueueItem; onDone: () => void }) {
  const client = getSupabaseClient();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all(item.documents.map(async (d) => [d.id, await verificationQueries.signedDocumentUrl(client, d.storage_path)] as const)).then((pairs) =>
      setUrls(Object.fromEntries(pairs.filter(([, u]) => u) as [string, string][]))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const decide = async (status: 'approved' | 'rejected' | 'in_review') => {
    setBusy(status);
    setErr(null);
    try {
      const months = EXPIRY_MONTHS[item.kind];
      const expires = status === 'approved' && months ? new Date(Date.now() + months * 30 * 86400000).toISOString() : undefined;
      const defaultReason = status === 'approved' ? `Checked by a reviewer against the ${KIND_LABEL[item.kind].toLowerCase()} submitted.` : reason.trim();
      await verificationQueries.decideVerification(client, item.id, status, reason.trim() || defaultReason, expires);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(null);
    }
  };

  const details = item.details as Record<string, unknown>;
  return (
    <li className="border-b border-line py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div>
          <span className="text-[clamp(1.05rem,1.6vw,1.3rem)] font-semibold tracking-display">{item.person?.full_name ?? 'Unknown'}</span>
          <span className="ml-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">{KIND_LABEL[item.kind] ?? item.kind}</span>
        </div>
        <span className="text-[12px] text-steel">
          submitted {new Date(item.submitted_at).toLocaleString()} · tier {item.person?.verification_tier} · {item.status}
        </span>
      </div>
      {Object.keys(details).length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
          {Object.entries(details).map(([k, v]) => (
            <div key={k}><dt className="inline text-steel">{k.replace(/_/g, ' ')}: </dt><dd className="inline font-medium">{String(v ?? '')}</dd></div>
          ))}
        </dl>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {item.documents.map((d) => (
          <figure key={d.id} className="m-0 w-[220px] border border-line">
            {urls[d.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <a href={urls[d.id]} target="_blank" rel="noreferrer"><img src={urls[d.id]} alt={d.label} className="block aspect-[4/3] w-full object-cover" /></a>
            ) : (
              <div className="aspect-[4/3] w-full bg-ash" />
            )}
            <figcaption className="border-t border-line px-2.5 py-1.5 text-[11px] uppercase tracking-[0.1em] text-steel">{d.label.replace(/_/g, ' ')}</figcaption>
          </figure>
        ))}
        {item.documents.length === 0 && <p className="text-[13px] text-steel">No images attached.</p>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Textarea id={`reason-${item.id}`} label="Decision, in words the person will read" rows={2} placeholder="e.g. The name on the insurance card does not match your ID. Upload a card in your own name." value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex flex-wrap items-end gap-2">
          <Button type="button" loading={busy === 'approved'} onClick={() => decide('approved')}>Approve</Button>
          <Button type="button" variant="secondary" loading={busy === 'rejected'} onClick={() => decide('rejected')} disabled={!reason.trim()}>Reject</Button>
          {item.status === 'submitted' && <Button type="button" variant="secondary" loading={busy === 'in_review'} onClick={() => decide('in_review')}>Mark in review</Button>}
        </div>
      </div>
      {err && <p className="mt-2 text-sm text-signal">{err}</p>}
    </li>
  );
}

export default function AdminVerificationsPage() {
  const { user, loading } = useRequireAuth();
  const { profile } = useAuth();
  const client = getSupabaseClient();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [statuses, setStatuses] = useState<VerificationStatus[]>(['submitted', 'in_review']);
  const [err, setErr] = useState<string | null>(null);
  const [suspendId, setSuspendId] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

  const load = useCallback(() => {
    verificationQueries.listQueue(client, statuses).then(setQueue).catch((e) => setErr(e instanceof Error ? e.message : 'Could not load'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses]);
  useEffect(() => {
    if (profile?.is_admin) load();
  }, [profile?.is_admin, load]);

  if (loading || !user) return null;
  if (profile && !profile.is_admin) return <p className="text-sm text-muted">This page is for reviewers.</p>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.5rem,2.4vw,1.95rem)] font-semibold leading-[1.1] tracking-display">Review queue</h1>
          <p className="mt-2 max-w-[56ch] text-[15px] text-muted">Oldest first. Approve with a default note or write your own; a rejection needs a reason. Identity and licence approvals run two years, insurance and selfies six months.</p>
        </div>
        <div className="flex gap-2 text-[12.5px]">
          {([['submitted', 'in_review'], ['approved'], ['rejected']] as VerificationStatus[][]).map((s) => (
            <button key={s.join()} type="button" onClick={() => setStatuses(s)} className={`rounded-full border px-3 py-1.5 font-semibold ${s.join() === statuses.join() ? 'border-ink bg-ink text-paper' : 'border-line-strong'}`}>
              {s[0] === 'submitted' ? 'Open' : s[0] === 'approved' ? 'Approved' : 'Rejected'}
            </button>
          ))}
        </div>
      </div>
      {err && <p className="mt-4 text-sm text-signal">{err}</p>}
      <ul className="mt-6 border-t border-ink">
        {queue.map((item) => <Item key={item.id} item={item} onDone={load} />)}
        {queue.length === 0 && <li className="py-8 text-sm text-muted">Nothing here.</li>}
      </ul>

      <section className="mt-12 border-t border-ink pt-5">
        <h2 className="text-[15px] font-semibold">Suspend or reinstate an account</h2>
        <p className="mt-1 text-[13px] text-muted">A suspension states its basis; the person sees the reason on their account page. Leave the reason empty to reinstate.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <input value={suspendId} onChange={(e) => setSuspendId(e.target.value)} placeholder="User id" className="border border-line bg-paper px-3.5 py-2.5 text-sm" />
          <input value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Reason, or empty to reinstate" className="border border-line bg-paper px-3.5 py-2.5 text-sm" />
          <Button type="button" variant="secondary" onClick={async () => { try { await verificationQueries.setSuspension(client, suspendId.trim(), suspendReason.trim() || null); setSuspendId(''); setSuspendReason(''); } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save'); } }}>Apply</Button>
        </div>
      </section>
    </div>
  );
}
