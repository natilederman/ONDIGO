import type { OndigoClient } from '../supabaseClient';
import type { Connection } from '../types';

export async function listConnections(client: OndigoClient, userId: string): Promise<Connection[]> {
  const { data, error } = await client.from('connections').select('*').eq('follower_id', userId);
  if (error) throw error;
  return data ?? [];
}

export async function isFollowing(client: OndigoClient, followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await client
    .from('connections')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function follow(client: OndigoClient, followerId: string, followingId: string): Promise<void> {
  const { error } = await client.from('connections').insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollow(client: OndigoClient, followerId: string, followingId: string): Promise<void> {
  const { error } = await client
    .from('connections')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) throw error;
}
