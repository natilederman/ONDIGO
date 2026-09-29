'use client';

/**
 * The prohibited-items list, in full, and the sender's attestation beneath it.
 * A checkbox next to a sentence nobody can act on is not a control; the list is.
 */
import { useEffect, useState } from 'react';
import { verificationQueries, type PolicyDocument, type ProhibitedItemRule } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';

const GROUPS: { key: ProhibitedItemRule['grp']; title: string; why: string }[] = [
  { key: 'legal', title: 'Against the law to carry', why: 'Absolute. No exceptions, no declared value.' },
  { key: 'insurer', title: 'Not covered', why: 'Nothing stands behind these if they are lost or damaged.' },
  { key: 'handling', title: 'Not for a private vehicle', why: 'Too heavy, too big, or licensed work in most states.' },
];

export function LegalDeclaration({
  checked,
  onChange,
  onPolicy,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onPolicy?: (policy: PolicyDocument) => void;
}) {
  const client = getSupabaseClient();
  const [rules, setRules] = useState<ProhibitedItemRule[]>([]);
  const [policy, setPolicy] = useState<PolicyDocument | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([verificationQueries.listProhibitedRules(client), verificationQueries.listPolicies(client)]).then(([r, p]) => {
      if (!alive) return;
      setRules(r);
      const latest = verificationQueries.latestPolicies(p)['prohibited_items'] ?? null;
      setPolicy(latest);
      if (latest && onPolicy) onPolicy(latest);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="border-t border-ink pt-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel">{policy?.title ?? 'What ONDIGO does not carry'}</h3>
        {policy && <span className="text-[11px] text-steel">Version {policy.version}</span>}
      </div>
      <div className="mt-3 grid gap-5 sm:grid-cols-3">
        {GROUPS.map((g) => (
          <div key={g.key}>
            <div className="text-[13px] font-semibold">{g.title}</div>
            <div className="mb-2 text-[12px] leading-snug text-steel">{g.why}</div>
            <ul className="space-y-1 border-t border-line pt-2 text-[13px] leading-snug">
              {rules
                .filter((r) => r.grp === g.key)
                .map((r) => (
                  <li key={r.id}>
                    {r.label}
                    {r.note && <span className="block text-[11.5px] text-steel">{r.note}</span>}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <label className="mt-5 flex items-start gap-3 border border-line p-4 text-sm">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--ink)]" />
        <span className="leading-relaxed">{policy?.body ?? 'I confirm the item is not on the prohibited list and that I have described its contents truthfully.'}</span>
      </label>
    </div>
  );
}
