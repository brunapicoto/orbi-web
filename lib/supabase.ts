import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client using the public anon key. The `waitlist` table only
 * allows inserts for anon (see supabase/waitlist.sql), so this key cannot
 * read the list back. Returns null when the env vars are not set yet.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
