import type { OndigoClient } from '../supabaseClient';
import type { Profile } from '../database.types';

export async function getProfile(client: OndigoClient, id: string): Promise<Profile> {
  const { data, error } = await client.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function updateProfile(
  client: OndigoClient,
  id: string,
  updates: Partial<Pick<Profile, 'full_name' | 'bio' | 'vehicle_type' | 'avatar_url'>>
): Promise<Profile> {
  const { data, error } = await client.from('profiles').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export function avatarPath(userId: string, fileExt: string) {
  return `${userId}/avatar.${fileExt}`;
}
