'use client';

/**
 * "Get ready to carry": the trust ladder as the person sees it. Each rung says
 * what it unlocks, what has been submitted, what was decided and why, and what
 * to do next. Silence after a submission is the failure the incumbents are
 * known for, so every open check shows when a decision is expected.
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  verificationQueries,
  TIER_LABELS,
  type Consent,
  type PolicyDocument,
  type ProfilePrivate,
  type Vehicle,
  type Verification,
  type VerificationKind,
} from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useAuth } from '@/lib/AuthProvider';
import { Input, Select, Textarea } from '@/components/Input';
import { Button } from '@/components/Button';

const LABEL = 'text-[11px] font-semibold uppercase tracking-[0.1em] text-steel';
const TIERS = ['none', 'contactable', 'identified', 'road_ready', 'screened', 'payable'] as const;
const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

function latest(vs: Verification[], kind: VerificationKind): Verification | undefined {
  return vs.filter((v) => v.kind === kind && v.status !== 'withdrawn').sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0];
}

function Status({ v, label }: { v: Verification | undefined; label: string }) {
  if (!v) return <span className="text-[12.5px] text-steel">{label}: not submitted</span>;
  const map: Record<string, string> = {
    submitted: 'submitted, decision expected within 2 business days',
    in_review: 'being reviewed',
    approved: `approved ${day(v.decided_at)}${v.expires_at ? ', valid until ' + day(v.expires_at) : ''}`,
    rejected: `not accepted ${day(v.decided_at)}`,
    pre_adverse_hold: 'on hold pending your response',
    expired: 'expired',
    withdrawn: 'withdrawn',
  };
  return (
    <span className="text-[12.5px]">
      <b className={`font-semibold ${v.status === 'approved' ? 'text-ink' : v.status === 'rejected' ? 'text-signal' : 'text-muted'}`}>{label}:</b>{' '}
      <span className="text-muted">{map[v.status] ?? v.status}</span>
      {v.decision_reason && v.status !== 'approved' && <span className="block text-steel">{v.decision_reason}</span>}
      {v.provider === 'demo' && <span className="block text-steel">Demo record from the seed; no document was checked.</span>}
    </span>
  );
}

function FileField({ id, label, hint, capture, onFile }: { id: string; label: string; hint?: string; capture?: 'user' | 'environment'; onFile: (f: File | null) => void }) {
  return (
    <div>
      <label htmlFor={id} className={`mb-2 block ${LABEL}`}>{label}</label>
      <input id={id} type="file" accept="image/*" capture={capture} onChange={(e) => onFile(e.target.files?.[0] ?? null)} className="block w-full text-sm file:mr-3 file:rounded-full file:border file:border-line-strong file:bg-paper file:px-4 file:py-1.5 file:text-[12.5px] file:font-semibold" />
      {hint && <span className="mt-1.5 block text-xs text-steel">{hint}</span>}
    </div>
  );
}

export default function VerifyPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { profile, refreshProfile } = useAuth();
  const client = getSupabaseClient();

  const [priv, setPriv] = useState<ProfilePrivate | null>(null);
  const [vs, setVs] = useState<Verification[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [policies, setPolicies] = useState<Record<string, PolicyDocument>>({});
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // step 1
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [ecName, setEcName] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [dob, setDob] = useState('');
  // step 2
  const [docType, setDocType] = useState('drivers_licence');
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  // step 3
  const [licFront, setLicFront] = useState<File | null>(null);
  const [licBack, setLicBack] = useState<File | null>(null);
  const [licExpiry, setLicExpiry] = useState('');
  const [insCard, setInsCard] = useState<File | null>(null);
  const [insName, setInsName] = useState('');
  const [insExpiry, setInsExpiry] = useState('');
  const [vType, setVType] = useState<'car' | 'truck'>('car');
  const [vMake, setVMake] = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear] = useState('');
  const [vPlate, setVPlate] = useState('');
  const [vState, setVState] = useState('');
  const [vin6, setVin6] = useState('');
  const [vPhoto, setVPhoto] = useState<File | null>(null);
  const [vReg, setVReg] = useState<File | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [p, v, c, pol, veh] = await Promise.all([
      verificationQueries.getPrivateProfile(client, user.id),
      verificationQueries.listMyVerifications(client, user.id),
      verificationQueries.listMyConsents(client, user.id),
      verificationQueries.listPolicies(client),
      verificationQueries.listMyVehicles(client, user.id),
    ]);
    setPriv(p);
    setVs(v);
    setConsents(c);
    setPolicies(verificationQueries.latestPolicies(pol));
    setVehicles(veh);
    if (p) {
      setEcName(p.emergency_contact_name ?? '');
      setEcPhone(p.emergency_contact_phone ?? '');
      setDob(p.date_of_birth ?? '');
      if (p.phone) setPhone(p.phone);
    }
    await refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    load().catch((e) => setErr(e instanceof Error ? e.message : 'Could not load'));
  }, [load]);

  if (authLoading || !user) return null;

  const tier = (profile?.verification_tier ?? 'none') as (typeof TIERS)[number];
  const tierIndex = TIERS.indexOf(tier);
  const has = (key: string) => consents.some((c) => c.policy_key === key && c.policy_version === (policies[key]?.version ?? -1));
  const run = async (name: string, fn: () => Promise<void>, done?: string) => {
    setBusy(name);
    setErr(null);
    setMsg(null);
    try {
      await fn();
      await load();
      if (done) setMsg(done);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  const sendCode = () =>
    run('phone', async () => {
      const { error } = await client.auth.updateUser({ phone: phone.trim() });
      if (error) {
        if (/provider|sms|not enabled|unsupported/i.test(error.message)) throw new Error('Phone codes are not switched on in this environment yet. Everything else on this page still works.');
        throw error;
      }
      setOtpSent(true);
    }, 'Code sent by SMS.');
  const confirmCode = () =>
    run('otp', async () => {
      const { error } = await client.auth.verifyOtp({ phone: phone.trim(), token: otp.trim(), type: 'phone_change' });
      if (error) throw error;
      setOtpSent(false);
      setOtp('');
    }, 'Phone confirmed.');
  const saveContact = () =>
    run('contact', async () => {
      await verificationQueries.savePrivateProfile(client, user.id, { emergency_contact_name: ecName.trim(), emergency_contact_phone: ecPhone.trim(), date_of_birth: dob || null });
    }, 'Saved.');

  const accept = (key: string) => run('consent-' + key, async () => { await verificationQueries.acceptPolicy(client, key); }, 'Recorded.');

  const submitIdentity = () =>
    run('identity', async () => {
      if (!idFront || !selfie) throw new Error('The front of the document and a selfie are both needed.');
      if (!has('biometric_notice')) throw new Error('Read and accept the notice before the selfie.');
      const idv = await verificationQueries.submitVerification(client, 'identity_document', { document_type: docType });
      await verificationQueries.attachDocument(client, user.id, idv.id, 'front', idFront, idFront.name);
      if (idBack) await verificationQueries.attachDocument(client, user.id, idv.id, 'back', idBack, idBack.name);
      const live = await verificationQueries.submitVerification(client, 'liveness', {});
      await verificationQueries.attachDocument(client, user.id, live.id, 'selfie', selfie, selfie.name);
      setIdFront(null); setIdBack(null); setSelfie(null);
    }, 'Submitted. A reviewer looks at it within two business days; you will see the decision here.');

  const submitRoad = () =>
    run('road', async () => {
      if (!licFront || !insCard || !vPhoto) throw new Error('Licence, insurance card and a vehicle photo are all needed.');
      if (!vPlate.trim()) throw new Error('Enter the plate.');
      const lic = await verificationQueries.submitVerification(client, 'driving_licence', { expires_on: licExpiry || null });
      await verificationQueries.attachDocument(client, user.id, lic.id, 'licence_front', licFront, licFront.name);
      if (licBack) await verificationQueries.attachDocument(client, user.id, lic.id, 'licence_back', licBack, licBack.name);
      const ins = await verificationQueries.submitVerification(client, 'insurance', { named_insured: insName.trim(), expires_on: insExpiry || null });
      await verificationQueries.attachDocument(client, user.id, ins.id, 'insurance_card', insCard, insCard.name);
      const veh = await verificationQueries.submitVerification(client, 'vehicle', { plate: vPlate.trim(), vehicle_type: vType, make: vMake, model: vModel, year: vYear });
      await verificationQueries.attachDocument(client, user.id, veh.id, 'vehicle_photo', vPhoto, vPhoto.name);
      if (vReg) await verificationQueries.attachDocument(client, user.id, veh.id, 'registration', vReg, vReg.name);
      await verificationQueries.addVehicle(client, {
        user_id: user.id, verification_id: veh.id, vehicle_type: vType, make: vMake || null, model: vModel || null,
        model_year: vYear ? Number(vYear) : null, colour: null, plate: vPlate.trim(), plate_state: vState || null, vin_last6: vin6 || null,
        insurance_named_insured: insName || null, insurance_expires_on: insExpiry || null, licence_expires_on: licExpiry || null,
      });
    }, 'Submitted. Licence, insurance and vehicle are reviewed together.');

  const idV = latest(vs, 'identity_document'), liveV = latest(vs, 'liveness');
  const licV = latest(vs, 'driving_licence'), insV = latest(vs, 'insurance'), vehV = latest(vs, 'vehicle');
  const recV = latest(vs, 'criminal_records'), mvrV = latest(vs, 'motor_vehicle_record');

  const Section = ({ n, id, title, unlocks, reached, children }: { n: number; id: string; title: string; unlocks: string; reached: boolean; children: React.ReactNode }) => (
    <section id={id} className="border-t border-ink pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-[clamp(1.15rem,1.8vw,1.45rem)] font-semibold tracking-display">
          <span className="mr-3 text-steel">{n}</span>{title}
        </h2>
        <span className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${reached ? 'text-ink' : 'text-steel'}`}>{reached ? 'Reached' : 'Unlocks: ' + unlocks}</span>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[clamp(1.5rem,2.4vw,1.95rem)] font-semibold leading-[1.1] tracking-display">Get ready to carry</h1>
      <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-muted">
        You can browse with an account. Posting needs a phone. Carrying someone's things needs a checked identity. Car and truck jobs need your licence, insurance and vehicle on file. Nothing here is asked before it is needed.
      </p>

      {profile?.suspended_at && (
        <p className="mt-5 border-l-2 border-signal pl-3 text-sm">
          <b className="font-semibold text-signal">This account is suspended.</b> {profile.suspension_reason} You can reply to the reviewer from this page once appeals are live; until then, contact us.
        </p>
      )}

      <div className="mt-7 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TIERS.map((t, i) => (
          <div key={t} className={`border-t-2 pt-2 ${i <= tierIndex ? 'border-ink' : 'border-line'}`}>
            <div className={`text-[12px] font-semibold ${i <= tierIndex ? 'text-ink' : 'text-steel'}`}>{TIER_LABELS[t].label}</div>
            <div className="mt-0.5 hidden text-[11px] leading-snug text-steel sm:block">{TIER_LABELS[t].unlocks}</div>
          </div>
        ))}
      </div>

      {(msg || err) && (
        <p role="status" className={`mt-5 border-l-2 pl-3 text-sm ${err ? 'border-signal text-signal' : 'border-ink text-ink'}`}>{err ?? msg}</p>
      )}

      <div className="mt-8 space-y-10">
        <Section n={1} id="contactable" title="Be reachable" unlocks="posting and messaging" reached={tierIndex >= 1}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className={LABEL}>Email</div>
              <div className="mt-1.5 text-sm">{priv?.email_verified_at ? `Confirmed ${day(priv.email_verified_at)}` : 'Not confirmed yet. Check your inbox for the link.'}</div>
            </div>
            <div>
              <div className={LABEL}>Phone</div>
              <div className="mt-1.5 text-sm">{priv?.phone_verified_at ? `${priv.phone} confirmed ${day(priv.phone_verified_at)}` : 'Not confirmed'}</div>
            </div>
          </div>
          {!priv?.phone_verified_at && (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Input id="phone" label="Mobile number" type="tel" inputMode="tel" placeholder="+1 415 555 0100" value={phone} onChange={(e) => setPhone(e.target.value)} hint="A code is sent by SMS. Carrier rates may apply." />
              <Button type="button" variant="secondary" loading={busy === 'phone'} onClick={sendCode}>Send code</Button>
              {otpSent && (
                <>
                  <Input id="otp" label="Code" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} />
                  <Button type="button" loading={busy === 'otp'} onClick={confirmCode}>Confirm</Button>
                </>
              )}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Input id="ec-name" label="Emergency contact" placeholder="Name" value={ecName} onChange={(e) => setEcName(e.target.value)} />
            <Input id="ec-phone" label="Their phone" type="tel" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} />
            <Input id="dob" label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} hint="18 to carry by bike or on foot, 21 to drive." />
          </div>
          <Button type="button" variant="secondary" loading={busy === 'contact'} onClick={saveContact}>Save</Button>
        </Section>

        <Section n={2} id="identified" title="Prove who you are" unlocks="bidding and carrying" reached={tierIndex >= 2}>
          <div className="space-y-1.5">
            <Status v={idV} label="ID document" />
            <br />
            <Status v={liveV} label="Selfie" />
          </div>
          {['biometric_notice', 'prohibited_items', 'driver_terms'].map((key) => {
            const pol = policies[key];
            if (!pol) return null;
            return (
              <div key={key} className="border border-line p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-sm font-semibold">{pol.title}</h3>
                  <span className="text-[11px] text-steel">v{pol.version}</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{pol.body}</p>
                {key === 'prohibited_items' && <Link href="/requests/new#prohibited" className="mt-1 inline-block text-[12.5px] underline">See the full list</Link>}
                <div className="mt-3">
                  {has(key) ? (
                    <span className="text-[12.5px] font-semibold">Accepted</span>
                  ) : (
                    <Button type="button" variant="secondary" loading={busy === 'consent-' + key} onClick={() => accept(key)}>I have read this and agree</Button>
                  )}
                </div>
              </div>
            );
          })}
          {idV?.status !== 'approved' && (
            <div className="space-y-4 border-t border-line pt-4">
              <Select id="doc-type" label="Document" value={docType} onChange={(e) => setDocType(e.target.value)}>
                <option value="drivers_licence">Driver's licence</option>
                <option value="passport">Passport</option>
                <option value="state_id">State ID card</option>
              </Select>
              <div className="grid gap-4 sm:grid-cols-3">
                <FileField id="id-front" label="Front" capture="environment" onFile={setIdFront} hint="All four corners, no glare." />
                <FileField id="id-back" label="Back" capture="environment" onFile={setIdBack} hint="Not needed for a passport." />
                <FileField id="selfie" label="Selfie" capture="user" onFile={setSelfie} hint="Your face, now, no hat or glasses." />
              </div>
              <p className="text-[12.5px] text-steel">Reviewed by a person. Images are deleted within 90 days; ONDIGO keeps the result and the date.</p>
              <Button type="button" loading={busy === 'identity'} onClick={submitIdentity} disabled={!has('biometric_notice')}>Submit for review</Button>
            </div>
          )}
        </Section>

        <Section n={3} id="road" title="Put a vehicle on file" unlocks="car and truck jobs" reached={tierIndex >= 3}>
          <div className="space-y-1.5">
            <Status v={licV} label="Driving licence" /><br />
            <Status v={insV} label="Insurance" /><br />
            <Status v={vehV} label="Vehicle" />
          </div>
          {vehicles.length > 0 && (
            <ul className="text-[13px] text-muted">
              {vehicles.map((v) => (
                <li key={v.id}>{[v.model_year, v.make, v.model].filter(Boolean).join(' ')} · {v.plate}{v.plate_state ? ' ' + v.plate_state : ''} · {v.vehicle_type}</li>
              ))}
            </ul>
          )}
          <p className="text-[13px] leading-relaxed text-muted">
            The insurance card must name you and the vehicle. <b className="font-semibold text-ink">A personal auto policy usually excludes carrying goods for payment.</b> Ask your insurer for a delivery endorsement; ONDIGO does not insure your vehicle.
          </p>
          {vehV?.status !== 'approved' && (
            <div className="space-y-4 border-t border-line pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <FileField id="lic-front" label="Licence, front" capture="environment" onFile={setLicFront} />
                <FileField id="lic-back" label="Licence, back" capture="environment" onFile={setLicBack} />
                <Input id="lic-exp" label="Licence expires" type="date" value={licExpiry} onChange={(e) => setLicExpiry(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <FileField id="ins-card" label="Insurance card" capture="environment" onFile={setInsCard} />
                <Input id="ins-name" label="Named insured" value={insName} onChange={(e) => setInsName(e.target.value)} hint="Must match your name." />
                <Input id="ins-exp" label="Policy expires" type="date" value={insExpiry} onChange={(e) => setInsExpiry(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <Select id="v-type" label="Vehicle" value={vType} onChange={(e) => setVType(e.target.value as 'car' | 'truck')}>
                  <option value="car">Car, SUV or van</option>
                  <option value="truck">Truck</option>
                </Select>
                <Input id="v-make" label="Make" value={vMake} onChange={(e) => setVMake(e.target.value)} />
                <Input id="v-model" label="Model" value={vModel} onChange={(e) => setVModel(e.target.value)} />
                <Input id="v-year" label="Year" inputMode="numeric" value={vYear} onChange={(e) => setVYear(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input id="v-plate" label="Plate" value={vPlate} onChange={(e) => setVPlate(e.target.value)} required />
                <Input id="v-state" label="Plate state" value={vState} onChange={(e) => setVState(e.target.value)} placeholder="CA" />
                <Input id="v-vin" label="VIN, last 6" value={vin6} onChange={(e) => setVin6(e.target.value)} hint="From the insurance card." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FileField id="v-photo" label="Vehicle photo" capture="environment" onFile={setVPhoto} hint="Plate visible." />
                <FileField id="v-reg" label="Registration" capture="environment" onFile={setVReg} />
              </div>
              <Button type="button" loading={busy === 'road'} onClick={submitRoad} disabled={tierIndex < 2}>Submit for review</Button>
              {tierIndex < 2 && <p className="text-[12.5px] text-steel">Finish step 2 first.</p>}
            </div>
          )}
        </Section>

        <Section n={4} id="screened" title="Records check" unlocks="jobs above the value threshold" reached={tierIndex >= 4}>
          <div className="space-y-1.5">
            <Status v={recV} label="Criminal records" /><br />
            <Status v={mvrV} label="Driving record" />
          </div>
          {policies.fcra_disclosure && (
            <div className="border border-line p-4">
              <h3 className="text-sm font-semibold">{policies.fcra_disclosure.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{policies.fcra_disclosure.body}</p>
            </div>
          )}
          <p className="text-[13px] leading-relaxed text-muted">
            ONDIGO opens this check when a job you want needs it. The report comes from a consumer reporting agency; before any decision against you, you receive a copy and time to respond. Not running in this environment yet.
          </p>
        </Section>

        <Section n={5} id="payable" title="Get paid" unlocks="payouts" reached={tierIndex >= 5}>
          <p className="text-[13px] leading-relaxed text-muted">Bank and tax details are collected by the payment processor, never by ONDIGO. Payments are simulated in this demo; nothing is collected here yet.</p>
        </Section>
      </div>
    </div>
  );
}
