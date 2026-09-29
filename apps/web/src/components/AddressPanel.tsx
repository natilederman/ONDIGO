/**
 * One end of a delivery, as the driver needs it on the day.
 *
 * `locked` is the normal state for anyone who has not won the job: row-level
 * security simply does not return the contact row, so the panel shows the public
 * street address and says plainly why the rest is missing.
 */
import { handoffInstruction, handoffLabel } from '@/lib/format';

export function AddressPanel({
  title,
  line1,
  line2,
  postcode,
  name,
  phone,
  notes,
  locked,
  end,
  handoff,
  when,
}: {
  title: string;
  line1: string;
  line2?: string | null;
  postcode?: string | null;
  name?: string | null;
  phone?: string | null;
  notes?: string | null;
  locked?: boolean;
  end: 'pickup' | 'dropoff';
  handoff?: string | null;
  when?: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">{title}</div>

      <address className="mt-2 not-italic text-[15px] leading-snug">
        <span className="font-medium">{line1}</span>
        {line2 && <span className="mt-0.5 block text-muted">{line2}</span>}
        {postcode && <span className="tnum mt-0.5 block text-muted">{postcode}</span>}
      </address>

      <dl className="mt-4 border-t border-ink">
        {when && (
          <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
            <dt className="text-[13px] text-steel">When</dt>
            <dd className="tnum text-right text-[13px] font-medium">{when}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
          <dt className="text-[13px] text-steel">Handoff</dt>
          <dd className="text-right text-[13px] font-medium">{handoffLabel(end, handoff)}</dd>
        </div>
      </dl>
      <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{handoffInstruction(end, handoff)}</p>

      {(name || phone) && (
        <dl className="mt-3 border-t border-line">
          {name && (
            <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
              <dt className="text-[13px] text-steel">Ask for</dt>
              <dd className="text-[13px] font-medium">{name}</dd>
            </div>
          )}
          {phone && (
            <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
              <dt className="text-[13px] text-steel">Phone</dt>
              <dd className="tnum text-[13px] font-medium">
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="underline">
                  {phone}
                </a>
              </dd>
            </div>
          )}
        </dl>
      )}

      {notes && (
        <p className="mt-3 border-l-2 border-line-strong pl-3 text-[13px] leading-relaxed text-muted">
          {notes}
        </p>
      )}

      {locked && (
        // Row-level security returns nothing both when the viewer is not
        // entitled and when the sender simply left these blank, so the copy
        // states the rule rather than guessing which case this is.
        <p className="mt-3 text-[12.5px] leading-relaxed text-steel">
          No apartment, contact or access notes on file. These are visible to the sender and to the
          driver carrying the job.
        </p>
      )}
    </div>
  );
}
