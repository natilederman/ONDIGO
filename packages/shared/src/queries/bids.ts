import type { OndigoClient } from '../supabaseClient';
import type { Bid, Delivery, DriverSummary } from '../database.types';

export type BidWithDriver = Bid & { driver: DriverSummary | null };

export async function listBidsForRequest(client: OndigoClient, requestId: string): Promise<BidWithDriver[]> {
  const { data, error } = await client
    .from('bids')
    .select('*, driver:profiles!bids_driver_id_fkey(id, full_name, avatar_url, vehicle_type, rating_avg, rating_count)')
    .eq('request_id', requestId)
    .order('amount', { ascending: true });
  if (error) throw error;
  return (data as unknown as BidWithDriver[]) ?? [];
}

export async function placeBid(client: OndigoClient, requestId: string, amount: number): Promise<Bid> {
  const { data, error } = await client.rpc('place_bid', { p_request_id: requestId, p_amount: amount });
  if (error) throw error;
  return data as Bid;
}

export async function acceptBid(client: OndigoClient, bidId: string): Promise<Delivery> {
  const { data, error } = await client.rpc('accept_bid', { p_bid_id: bidId });
  if (error) throw error;
  return data as Delivery;
}

export async function acceptFixedPriceRequest(client: OndigoClient, requestId: string): Promise<Delivery> {
  const { data, error } = await client.rpc('accept_fixed_price_request', { p_request_id: requestId });
  if (error) throw error;
  return data as Delivery;
}

export function subscribeToBids(client: OndigoClient, requestId: string, onChange: (bids: BidWithDriver[]) => void) {
  const refresh = async () => {
    onChange(await listBidsForRequest(client, requestId));
  };
  const channel = client
    .channel(`bids-${requestId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bids', filter: `request_id=eq.${requestId}` },
      () => {
        refresh();
      }
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
