/**
 * The trust ladder: what a person has submitted, what was decided, and the
 * policies they accepted. Reviewers use the same module with the admin RPCs.
 */
import type { OndigoClient } from '../supabaseClient';
import type { Json } from '../database.types';
import type {
  Consent,
  DriverPublicTrust,
  PolicyDocument,
  ProfilePrivate,
  ProhibitedItemRule,
  Vehicle,
  Verification,
  VerificationDocument,
  VerificationKind,
  VerificationStatus,
} from '../types';

export async function listMyVerifications(client: OndigoClient, userId: string): Promise<Verification[]> {
  const { data, error } = await client.from('verifications').select('*').eq('user_id', userId).order('submitted_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPrivateProfile(client: OndigoClient, userId: string): Promise<ProfilePrivate | null> {
  const { data, error } = await client.from('profile_private').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function savePrivateProfile(
  client: OndigoClient,
  userId: string,
  patch: Partial<Pick<ProfilePrivate, 'date_of_birth' | 'emergency_contact_name' | 'emergency_contact_phone'>>
): Promise<ProfilePrivate> {
  const { data, error } = await client
    .from('profile_private')
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitVerification(client: OndigoClient, kind: VerificationKind, details: Record<string, unknown> = {}): Promise<Verification> {
  const { data, error } = await client.rpc('submit_verification', { p_kind: kind, p_details: details as Json });
  if (error) throw error;
  return data as Verification;
}

/** verification-documents/{user}/{verification}/{label}.{ext} */
export function documentPath(userId: string, verificationId: string, label: string, fileName: string) {
  const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
  return `${userId}/${verificationId}/${label}.${ext}`;
}

export async function attachDocument(
  client: OndigoClient,
  userId: string,
  verificationId: string,
  label: string,
  file: File | Blob,
  fileName: string
): Promise<VerificationDocument> {
  const path = documentPath(userId, verificationId, label, fileName);
  const { error: upErr } = await client.storage.from('verification-documents').upload(path, file, { upsert: true });
  if (upErr) throw upErr;
  const { data, error } = await client
    .from('verification_documents')
    .insert({ verification_id: verificationId, user_id: userId, label, storage_path: path })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addVehicle(client: OndigoClient, vehicle: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle> {
  const { data, error } = await client.from('vehicles').insert(vehicle).select().single();
  if (error) throw error;
  return data;
}

export async function listMyVehicles(client: OndigoClient, userId: string): Promise<Vehicle[]> {
  const { data, error } = await client.from('vehicles').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listPolicies(client: OndigoClient): Promise<PolicyDocument[]> {
  const { data, error } = await client.from('policy_documents').select('*').order('published_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** The newest version of each policy, keyed by policy key. */
export function latestPolicies(all: PolicyDocument[]): Record<string, PolicyDocument> {
  const out: Record<string, PolicyDocument> = {};
  for (const p of all) if (!out[p.key] || out[p.key].version < p.version) out[p.key] = p;
  return out;
}

export async function listProhibitedRules(client: OndigoClient): Promise<ProhibitedItemRule[]> {
  const { data, error } = await client.from('prohibited_item_rules').select('*').order('sort');
  if (error) throw error;
  return data ?? [];
}

export async function listMyConsents(client: OndigoClient, userId: string): Promise<Consent[]> {
  const { data, error } = await client.from('consents').select('*').eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

export async function acceptPolicy(client: OndigoClient, key: string, context: Record<string, unknown> = {}): Promise<Consent> {
  const { data, error } = await client.rpc('accept_policy', { p_key: key, p_context: context as Json });
  if (error) throw error;
  return data as Consent;
}

export async function whyCannotTake(client: OndigoClient, requestId: string): Promise<string | null> {
  const { data, error } = await client.rpc('why_cannot_take_request', { p_request_id: requestId });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function logEvent(client: OndigoClient, event: string, meta: Record<string, unknown> = {}): Promise<void> {
  await client.rpc('log_onboarding_event', { p_event: event, p_meta: meta as Json });
}

export async function getSettings(client: OndigoClient): Promise<Record<string, number>> {
  const { data, error } = await client.from('platform_settings').select('key, value');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, Number(r.value)]));
}

// ---------- reviewer side ----------

export type QueueItem = Verification & {
  person: { id: string; full_name: string; verification_tier: string; suspended_at: string | null } | null;
  documents: VerificationDocument[];
};

export async function listQueue(client: OndigoClient, statuses: VerificationStatus[] = ['submitted', 'in_review']): Promise<QueueItem[]> {
  const { data, error } = await client
    .from('verifications')
    .select('*, person:profiles!verifications_user_id_fkey(id, full_name, verification_tier, suspended_at), documents:verification_documents(*)')
    .in('status', statuses)
    .order('submitted_at', { ascending: true });
  if (error) throw error;
  return (data as unknown as QueueItem[]) ?? [];
}

export async function decideVerification(
  client: OndigoClient,
  id: string,
  status: 'approved' | 'rejected' | 'in_review',
  reason: string,
  expiresAt?: string
): Promise<Verification> {
  const { data, error } = await client.rpc('decide_verification', { p_id: id, p_status: status, p_reason: reason, ...(expiresAt ? { p_expires_at: expiresAt } : {}) });
  if (error) throw error;
  return data as Verification;
}

export async function setSuspension(client: OndigoClient, userId: string, reason: string | null): Promise<void> {
  const { error } = await client.rpc('set_suspension', { p_user: userId, p_reason: reason as unknown as string });
  if (error) throw error;
}

export async function publicTrust(client: OndigoClient, ids: string[]): Promise<Record<string, DriverPublicTrust>> {
  if (!ids.length) return {};
  const { data, error } = await client.rpc('get_public_trust', { p_ids: ids });
  if (error) throw error;
  return Object.fromEntries(((data ?? []) as DriverPublicTrust[]).map((t) => [t.user_id, t]));
}

export async function signedDocumentUrl(client: OndigoClient, path: string, seconds = 300): Promise<string | null> {
  const { data, error } = await client.storage.from('verification-documents').createSignedUrl(path, seconds);
  if (error) return null;
  return data.signedUrl;
}
