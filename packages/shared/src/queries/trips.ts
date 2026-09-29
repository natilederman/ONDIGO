import type { OndigoClient } from '../supabaseClient';
import type { Trip, DriverSummary } from '../types';

export type NewTrip = Omit<Trip, 'id' | 'driver_id' | 'status' | 'created_at'>;
export type TripWithDriver = Trip & { driver: DriverSummary | null };

const WITH_DRIVER_SELECT = '*, driver:profiles!trips_driver_id_fkey(id, full_name, avatar_url, vehicle_type, rating_avg, rating_count)';

export async function listOpenTrips(client: OndigoClient): Promise<TripWithDriver[]> {
  const { data, error } = await client
    .from('trips')
    .select(WITH_DRIVER_SELECT)
    .eq('status', 'active')
    .order('depart_at', { ascending: true });
  if (error) throw error;
  return (data as unknown as TripWithDriver[]) ?? [];
}

export async function getTrip(client: OndigoClient, id: string): Promise<TripWithDriver> {
  const { data, error } = await client.from('trips').select(WITH_DRIVER_SELECT).eq('id', id).single();
  if (error) throw error;
  return data as unknown as TripWithDriver;
}

export async function myTrips(client: OndigoClient, driverId: string): Promise<Trip[]> {
  const { data, error } = await client
    .from('trips')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTrip(client: OndigoClient, driverId: string, input: NewTrip): Promise<Trip> {
  const { data, error } = await client
    .from('trips')
    .insert({ ...input, driver_id: driverId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelTrip(client: OndigoClient, id: string): Promise<void> {
  const { error } = await client.from('trips').update({ status: 'cancelled' }).eq('id', id);
  if (error) throw error;
}
