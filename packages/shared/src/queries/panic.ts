import type { OndigoClient } from '../supabaseClient';
import type { PanicAlert } from '../database.types';

export async function triggerPanicAlert(
  client: OndigoClient,
  deliveryId: string | null,
  lat: number | null,
  lng: number | null
): Promise<PanicAlert> {
  const { data, error } = await client.rpc('trigger_panic_alert', {
    p_delivery_id: deliveryId,
    p_lat: lat,
    p_lng: lng,
  });
  if (error) throw error;
  return data as PanicAlert;
}
