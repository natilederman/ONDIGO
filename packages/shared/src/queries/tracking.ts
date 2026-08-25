import type { OndigoClient } from '../supabaseClient';
import type { LocationPing } from '../database.types';

export async function recordPing(client: OndigoClient, deliveryId: string, lat: number, lng: number): Promise<void> {
  const { error } = await client.from('location_pings').insert({ delivery_id: deliveryId, lat, lng });
  if (error) throw error;
}

export async function latestPing(client: OndigoClient, deliveryId: string): Promise<LocationPing | null> {
  const { data, error } = await client
    .from('location_pings')
    .select('*')
    .eq('delivery_id', deliveryId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function subscribeToPings(
  client: OndigoClient,
  deliveryId: string,
  onInsert: (ping: LocationPing) => void
) {
  const channel = client
    .channel(`pings-${deliveryId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'location_pings', filter: `delivery_id=eq.${deliveryId}` },
      (payload) => onInsert(payload.new as LocationPing)
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
