/**
 * Conversations between a member and a driver about a trip, before anything
 * is booked. One private thread per member per trip; offers live in the same
 * stream as messages and are answered through respond_to_offer().
 */
import type { OndigoClient } from '../supabaseClient';
import type { ThreadSummary, TripMessage, TripThread } from '../types';

/** The signed-in member's thread on this trip, if they have written before. */
export async function findThread(client: OndigoClient, tripId: string, memberId: string): Promise<TripThread | null> {
  const { data, error } = await client.from('trip_threads').select('*').eq('trip_id', tripId).eq('member_id', memberId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getThread(client: OndigoClient, threadId: string): Promise<TripThread | null> {
  const { data, error } = await client.from('trip_threads').select('*').eq('id', threadId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Made on the member's first message. */
export async function openThread(client: OndigoClient, tripId: string): Promise<string> {
  const { data, error } = await client.rpc('open_trip_thread', { p_trip: tripId });
  if (error) throw error;
  return data as string;
}

export async function listMessages(client: OndigoClient, threadId: string): Promise<TripMessage[]> {
  const { data, error } = await client.from('trip_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendText(client: OndigoClient, threadId: string, senderId: string, body: string) {
  const { error } = await client.from('trip_messages').insert({ thread_id: threadId, sender_id: senderId, body });
  if (error) throw error;
}

export async function sendOffer(client: OndigoClient, threadId: string, senderId: string, item: string, amount: number, body = '') {
  const { error } = await client
    .from('trip_messages')
    .insert({ thread_id: threadId, sender_id: senderId, body, offer_item: item, offer_amount: amount, offer_status: 'open' });
  if (error) throw error;
}

export async function respond(client: OndigoClient, messageId: string, action: 'accept' | 'decline' | 'counter', amount?: number) {
  const { error } = await client.rpc('respond_to_offer', { p_message: messageId, p_action: action, p_amount: amount });
  if (error) throw error;
}

/** Demo drivers answer on their own; a no-op for real drivers. */
export async function demoReply(client: OndigoClient, threadId: string) {
  const { error } = await client.rpc('demo_driver_reply', { p_thread: threadId });
  if (error) throw error;
}

export async function isDemoDriver(client: OndigoClient, driverId: string): Promise<boolean> {
  const { data } = await (client as unknown as { rpc: (fn: string, args: object) => Promise<{ data: boolean | null }> }).rpc('is_demo_driver', { p_driver: driverId });
  return !!data;
}

export async function markRead(client: OndigoClient, threadId: string) {
  await client.rpc('mark_thread_read', { p_thread: threadId });
}

export async function unreadCount(client: OndigoClient): Promise<number> {
  const { data, error } = await client.rpc('my_unread_count');
  if (error) return 0;
  return data ?? 0;
}

export async function myThreads(client: OndigoClient): Promise<ThreadSummary[]> {
  const { data, error } = await client.rpc('my_threads');
  if (error) throw error;
  return data ?? [];
}

/** New messages and offer changes in one thread, as they happen. */
export function subscribe(client: OndigoClient, threadId: string, onChange: () => void) {
  const channel = client
    .channel(`trip-thread-${threadId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_messages', filter: `thread_id=eq.${threadId}` }, onChange)
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
