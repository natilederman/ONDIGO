'use client';

import { createOndigoClient, type OndigoClient } from '@ondigo/shared';

let client: OndigoClient | undefined;

export function getSupabaseClient(): OndigoClient {
  if (!client) {
    client = createOndigoClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
