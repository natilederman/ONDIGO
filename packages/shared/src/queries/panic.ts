import type { OndigoClient } from '../supabaseClient';
import type { PanicAlert } from '../types';

export async function triggerPanicAlert(
  client: OndigoClient,
  deliveryId: string | null,
  lat: number | null,
  lng: number | null
): Promise<PanicAlert> {
  const { data, error } = await client.rpc('trigger_panic_alert', {
    // All three are nullable in Postgres: a panic can fire with no active
    // delivery, and with location permission denied. The generated types cannot
    // express nullable function arguments, so widen them here.
    p_delivery_id: deliveryId as unknown as string,
    p_lat: lat as unknown as number,
    p_lng: lng as unknown as number,
  });
  if (error) throw error;
  return data as PanicAlert;
}
