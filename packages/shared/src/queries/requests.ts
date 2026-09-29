import type { OndigoClient } from '../supabaseClient';
import type { DeliveryRequest, RequestContactDetails, NewRequestContactDetails } from '../types';

export type NewRequest = Omit<
  DeliveryRequest,
  | 'id' | 'sender_id' | 'status' | 'matched_trip_id' | 'matched_driver_id' | 'created_at' | 'current_price'
  // filled in by the declaration trigger
  | 'legal_declaration_accepted_at' | 'prohibited_items_version' | 'vehicle_type_required'
> & { current_price?: number | null };

export async function listOpenRequests(client: OndigoClient): Promise<DeliveryRequest[]> {
  const { data, error } = await client
    .from('delivery_requests')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getRequest(client: OndigoClient, id: string): Promise<DeliveryRequest> {
  const { data, error } = await client.from('delivery_requests').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function myRequests(client: OndigoClient, senderId: string): Promise<DeliveryRequest[]> {
  const { data, error } = await client
    .from('delivery_requests')
    .select('*')
    .eq('sender_id', senderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRequest(
  client: OndigoClient,
  senderId: string,
  input: NewRequest
): Promise<DeliveryRequest> {
  const payload = {
    ...input,
    sender_id: senderId,
    current_price: input.pricing_mode === 'auction' ? input.starting_price : null,
  };
  const { data, error } = await client.from('delivery_requests').insert(payload).select().single();
  if (error) throw error;
  return data;
}

/**
 * The precise address parts live in their own table because delivery_requests is
 * readable by every authenticated user while a request is open. Writing a phone
 * number or a door code onto the request itself would publish it platform-wide.
 */
export async function saveContactDetails(
  client: OndigoClient,
  requestId: string,
  details: Omit<NewRequestContactDetails, 'request_id'>
): Promise<RequestContactDetails> {
  const { data, error } = await client
    .from('request_contact_details')
    .upsert({ ...details, request_id: requestId, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Returns null rather than throwing when the caller is not entitled to see the
 * details: row-level security hides the row from drivers who have not won the
 * job, which is a normal state, not an error.
 */
export async function getContactDetails(
  client: OndigoClient,
  requestId: string
): Promise<RequestContactDetails | null> {
  const { data, error } = await client
    .from('request_contact_details')
    .select('*')
    .eq('request_id', requestId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export function subscribeToRequest(
  client: OndigoClient,
  requestId: string,
  onChange: (request: DeliveryRequest) => void
) {
  const channel = client
    .channel(`request-${requestId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'delivery_requests', filter: `id=eq.${requestId}` },
      (payload) => onChange(payload.new as DeliveryRequest)
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
