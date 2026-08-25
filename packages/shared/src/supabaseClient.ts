import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type OndigoClient = SupabaseClient<Database>;

export function createOndigoClient(
  url: string,
  anonKey: string,
  options?: SupabaseClientOptions<'public'>
): OndigoClient {
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase URL/anon key. Set them in your app env (see README) — run `supabase start` and copy the printed values.'
    );
  }
  return createClient<Database>(url, anonKey, options);
}
