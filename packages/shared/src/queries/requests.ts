import type { OndigoClient } from '../supabaseClient';
import type { DeliveryRequest } from '../database.types';

export type NewRequest = Omit<
  DeliveryRequest,
  'id' | 'sender_id' | 'status' | 'matched_trip_id' | 'matched_driver_id' | 'created_at' | 'current_price'
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
