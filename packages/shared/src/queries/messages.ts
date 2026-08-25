import type { OndigoClient } from '../supabaseClient';
import type { Message } from '../database.types';

export async function listMessages(client: OndigoClient, deliveryId: string): Promise<Message[]> {
  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('delivery_id', deliveryId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(
  client: OndigoClient,
  deliveryId: string,
  senderId: string,
  body: string
): Promise<Message> {
  const { data, error } = await client
    .from('messages')
    .insert({ delivery_id: deliveryId, sender_id: senderId, body })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function subscribeToMessages(
  client: OndigoClient,
  deliveryId: string,
  onInsert: (message: Message) => void
) {
  const channel = client
    .channel(`messages-${deliveryId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `delivery_id=eq.${deliveryId}` },
      (payload) => onInsert(payload.new as Message)
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
