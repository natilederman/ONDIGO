import type { OndigoClient } from '../supabaseClient';
import type { Delivery, DeliveryStatus, Transaction } from '../database.types';

export async function listMyDeliveries(client: OndigoClient, userId: string): Promise<Delivery[]> {
  const { data, error } = await client
    .from('deliveries')
    .select('*')
    .or(`driver_id.eq.${userId},sender_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDelivery(client: OndigoClient, id: string): Promise<Delivery> {
  const { data, error } = await client.from('deliveries').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function updateDeliveryStatus(
  client: OndigoClient,
  id: string,
  status: DeliveryStatus
): Promise<Delivery> {
  const { data, error } = await client.from('deliveries').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function setPickupPhoto(client: OndigoClient, id: string, url: string): Promise<Delivery> {
  const { data, error } = await client
    .from('deliveries')
    .update({ pickup_photo_url: url, pickup_photo_at: new Date().toISOString(), status: 'picked_up' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setDropoffPhoto(client: OndigoClient, id: string, url: string): Promise<Delivery> {
  const { data, error } = await client
    .from('deliveries')
    .update({ dropoff_photo_url: url, dropoff_photo_at: new Date().toISOString(), status: 'delivered' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fundEscrow(client: OndigoClient, deliveryId: string): Promise<Transaction> {
  const { data, error } = await client.rpc('fund_escrow', { p_delivery_id: deliveryId });
  if (error) throw error;
  return data as Transaction;
}

export async function confirmDelivery(client: OndigoClient, deliveryId: string): Promise<Delivery> {
  const { data, error } = await client.rpc('confirm_delivery', { p_delivery_id: deliveryId });
  if (error) throw error;
  return data as Delivery;
}

export async function refundEscrow(client: OndigoClient, deliveryId: string): Promise<Transaction> {
  const { data, error } = await client.rpc('refund_escrow', { p_delivery_id: deliveryId });
  if (error) throw error;
  return data as Transaction;
}

export async function getTransaction(client: OndigoClient, deliveryId: string): Promise<Transaction | null> {
  const { data, error } = await client.from('transactions').select('*').eq('delivery_id', deliveryId).maybeSingle();
  if (error) throw error;
  return data;
}

export function subscribeToDelivery(client: OndigoClient, id: string, onChange: (delivery: Delivery) => void) {
  const channel = client
    .channel(`delivery-${id}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'deliveries', filter: `id=eq.${id}` },
      (payload) => onChange(payload.new as Delivery)
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
